import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
// models accessed via DB queries below

export default class AdminController {
	public async dashboard({ view }: HttpContext) {
		// Totals
		const usersCountRow = await db.from('users').count('id as total')
		// Count only non-deleted (active) objects for more relevant stats
		const donationsCountRow = await db.from('donation_objects').where('is_deleted', false).count('id as total')
		const chercheCountRow = await db.from('cherche_objects').where('is_deleted', false).count('id as total')
		const reservationsCountRow = await db
			.from('donation_objects')
			.whereNotNull('reserved_by')
			.where('is_deleted', false)
			.count('id as total')

		const extractTotal = (row: any) => {
			const val = row && row[0] && (row[0].total ?? Object.values(row[0])[0])
			return Number(val || 0)
		}

		const usersTotal = extractTotal(usersCountRow)
		const donationsTotal = extractTotal(donationsCountRow)
		const chercheTotal = extractTotal(chercheCountRow)
		const reservationsTotal = extractTotal(reservationsCountRow)

		// Users growth last 10 days
		const days = 10
		const since = DateTime.now().minus({ days: days - 1 }).startOf('day')
		const usersRows = await db.from('users').select('created_at').where('created_at', '>=', since.toSQL())

		const labels: string[] = []
		const data: number[] = []
		for (let i = 0; i < days; i++) {
			const day = since.plus({ days: i })
			const key = day.toFormat('yyyy-MM-dd')
			labels.push(key)
			data.push(0)
		}

		usersRows.forEach((r: any) => {
			const dt = new Date(r.created_at)
			const key = DateTime.fromJSDate(dt).toFormat('yyyy-MM-dd')
			const idx = labels.indexOf(key)
			if (idx >= 0) data[idx]++
		})

		const max = data.reduce((a, b) => (a > b ? a : b), 0)
		const usersSeriesRows = labels.map((label, i) => ({ label, count: data[i], percent: max > 0 ? Math.round((data[i] / max) * 100) : 0 }))

		// Fetch recent feedbacks (last 20)
		const feedbacks = await db.from('feedbacks').select('*').orderBy('created_at', 'desc').limit(20)

		const stats = {
			usersTotal,
			donationsTotal,
			chercheTotal,
			reservationsTotal,
			usersSeriesRows,
		}

		return view.render('pages/admin-dashboard', { stats, feedbacks })
	}
}
