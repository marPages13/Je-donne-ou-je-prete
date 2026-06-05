import DonationObject from '#models/donation-object'
import type { HttpContext } from '@adonisjs/core/http'
import {
  createDonationObjectValidator,
  updateDonationObjectValidator,
} from '#validators/donation_object'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import DonationPolicy from '#policies/donation_policy'
import { sendWithPool } from '#services/mail_pool'
import { purgeSoftDeletedObjects } from '#services/objects_retention_service'
import env from '#start/env'
import path from 'path'

export default class DonationObjectsController {
  /**
   * Liste des objets avec filtres (Home)
   */
  async index({ request, view, auth }: HttpContext) {
    await purgeSoftDeletedObjects()

    const filterType = request.input('filter_type')
    const filterCategorie = request.input('filter_categorie')
    const currentUser = auth.user
    const isExternalUser = !!currentUser?.extainre

    // On ajoute direct le filtre sur le status 1 ici
    let query = DonationObject.query()
      .where('donation_objects.status', 1)
      .where('donation_objects.is_deleted', false)
      .orderBy('donation_objects.urgent', 'desc')

    if (isExternalUser) {
      const externalCutoff = DateTime.now().minus({ months: 3 }).toFormat('yyyy-MM-dd HH:mm:ss')
      query = query.whereRaw('donation_objects.created_at <= ?', [externalCutoff])
    }

    query = query.orderBy('donation_objects.created_at', 'desc')

    if (filterType === '0') {
      query = query.where('donation_objects.type', false)
    } else if (filterType === '1') {
      query = query.where('donation_objects.type', true)
    }

    if (filterCategorie && filterCategorie !== '') {
      query = query.where('donation_objects.categorie', filterCategorie)
    }

    const objects = await query

    // Pour les filtres, on ne veut aussi que les catégories des objets dispos
    const categoriesResult = await db
      .from('donation_objects')
      .where('status', 1)
      .where('is_deleted', false)
      .distinct('categorie')
      .orderBy('categorie', 'asc')

    const categories = categoriesResult.map((row) => row.categorie)

    return view.render('pages/home', {
      objects,
      filterType,
      filterCategorie,
      categories,
    })
  }

  /**
   * Affiche le formulaire de création
   */
async create({ view, auth }: HttpContext) {
  const referentRow = await db.from('sustainability_roles').where('role_key', 'referent_durabilite').first()
  const isReferent = auth.user ? referentRow?.user_id === auth.user.id : false

  return view.render('pages/new-object', { isReferent })
}

  /**
   * Enregistre un nouvel objet (Compression WebP)
   */
  async store({ request, response, auth }: HttpContext) {
    if (!auth.user) return response.unauthorized('Vous devez être connecté.')

    const payload = await request.validateUsing(createDonationObjectValidator)
    const actAsReferent = request.input('as_referent') === '1'

    let fileName: string | null = null
    if (payload.image && payload.image.tmpPath) {
      fileName = `${cuid()}.webp`
      const customFolder = env.get('UPLOAD_DIR'); 
      const uploadPath = customFolder ? path.join(customFolder, fileName) : app.makePath('storage/uploads', fileName);
      await sharp(payload.image.tmpPath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(uploadPath)
    }

    const object = await DonationObject.create({
      userId: auth.user.id,
      name: payload.name,
      description: payload.description,
      type: payload.type === '1',
      categorie: payload.categorie,
      imagePath: fileName,
      status: 1,
      asReferent: actAsReferent,
      urgent: !!payload.IsUrgent,
      availableFrom: payload.available_from ? DateTime.fromJSDate(payload.available_from) : null,
      availableUntil: payload.available_until ? DateTime.fromJSDate(payload.available_until) : null,
    })

    return response.redirect().toRoute('donation_objects.show', { id: object.id })
  }

  /**
   * Affiche les détails d'un objet
   */
  async show({ params, view }: HttpContext) {
    const object = await DonationObject.query()
      .where('id', params.id)
      .where('is_deleted', false)
      .preload('user')
      .firstOrFail()

    return view.render('pages/details', { object })
  }

  /**
   * Formulaire d'édition (vérification propriétaire)
   */
  async edit({ params, view, bouncer }: HttpContext) {
    const object = await DonationObject.query()
      .where('id', params.id)
      .where('is_deleted', false)
      .firstOrFail()

    // Vérifie si l'utilisateur a le droit d'éditer selon la Policy
    await bouncer.with(DonationPolicy).authorize('edit', object)

    return view.render('pages/edit-object', { object })
  }

  /**
   * Suppression de l'objet et de son image
   */
  async destroy({ params, response, bouncer }: HttpContext) {
    const object = await DonationObject.query()
      .where('id', params.id)
      .where('is_deleted', false)
      .firstOrFail()

    // On vérifie le droit de suppression
    await bouncer.with(DonationPolicy).authorize('delete', object)

    object.isDeleted = true
    object.deletedAt = DateTime.now()
    await object.save()
    return response.redirect().toPath('/account')
  }

  async reserve({ params, auth, response, session, request, bouncer }: HttpContext) {
    try {
      const user = auth.user!
      await user.refresh()

      const userMessage = request.input('user_message', 'Aucun message particulier.')

      const item = await DonationObject.query()
        .where('id', params.id)
        .where('is_deleted', false)
        .preload('user')
        .firstOrFail()

      await bouncer.with(DonationPolicy).authorize('reserve', item)

      if (item.status === 2) {
        session.flash('error', 'Cet objet est déjà réservé.')
        return response.redirect().back()
      }

      item.status = 2
      item.reservedBy = user.id
      await item.save()

      const ownerEmail = item.user.email
      if (!ownerEmail) {
        session.flash('error', "Le propriétaire n'a pas d'email configuré.")
        return response.redirect().back()
      }

      await sendWithPool((message) => {
        const fromAddress = (env.get('SMTP_USERNAME') || env.get('MAIL_FROM_ADDRESS') || '').toString().trim()
        message
          .to(ownerEmail)
          .from(fromAddress)
          .subject(`Demande de réservation : ${item.name}`)
          .htmlView('emails/reservation', {
            item: item.toJSON(),
            requester: user.toJSON(),
            customMessage: userMessage,
          })
      })

      session.flash('success', 'Demande envoyée ! Retrouve-la dans ton historique.')
    } catch (error) {
      console.error(error)
      session.flash('error', "L'action a échoué.")
    }

    return response.redirect().back()
  }

  async republish({ params, auth, response, session }: HttpContext) {
    const user = auth.user!

    const object = await DonationObject.query()
      .where('id', params.id)
      .where('userId', user.id)
      .where('is_deleted', false)
      .firstOrFail()

    object.status = 1
    object.reservedBy = null
    await object.save()

    session.flash('success', "L'objet est de nouveau disponible !")
    return response.redirect().back()
  }

  /**
   * Met à jour un objet existant (avec gestion d'image)
   */
  async update({ params, request, response, auth, bouncer }: HttpContext) {
    if (!auth.user) return response.unauthorized('Vous devez être connecté.')

    const object = await DonationObject.query()
      .where('id', params.id)
      .where('is_deleted', false)
      .firstOrFail()
    await bouncer.with(DonationPolicy).authorize('edit', object)

    const payload = await request.validateUsing(updateDonationObjectValidator)

    // Gestion de l'image
    if (payload.image && payload.image.tmpPath) {
      // Supprimer l'ancienne image si elle existe
      if (object.imagePath) {
        try {
          const customFolder = env.get('UPLOAD_DIR');
          const uploadFolder = customFolder || 'storage/uploads';
          await fs.unlink(app.makePath(uploadFolder, object.imagePath))
        } catch (e) {}
      }
      // Enregistrer la nouvelle image
      const fileName = `${cuid()}.webp`
      const customFolder = env.get('UPLOAD_DIR');
      const uploadPath = customFolder ? path.join(customFolder, fileName) : app.makePath('storage/uploads', fileName);
      await sharp(payload.image.tmpPath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(uploadPath)
      object.imagePath = fileName
    }

    object.name = payload.name
    object.description = payload.description ?? null
    if (payload.type !== undefined) {
      object.type = payload.type === '1'
    }
    object.categorie = payload.categorie
    object.urgent = !!payload.IsUrgent
    object.availableFrom = payload.available_from
      ? DateTime.fromJSDate(payload.available_from)
      : null
    object.availableUntil = payload.available_until
      ? DateTime.fromJSDate(payload.available_until)
      : null

    await object.save()
    return response.redirect().toRoute('donation_objects.show', { id: object.id })
  }
}
