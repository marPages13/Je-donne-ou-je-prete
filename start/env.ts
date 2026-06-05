/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_TYPE: Env.schema.enum(['mysql', 'sqlite'] as const),
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),

  SMTP2_HOST: Env.schema.string.optional(),
  SMTP2_PORT: Env.schema.number.optional(),
  SMTP2_USERNAME: Env.schema.string.optional(),
  SMTP2_PASSWORD: Env.schema.string.optional(),

  SMTP3_HOST: Env.schema.string.optional(),
  SMTP3_PORT: Env.schema.number.optional(),
  SMTP3_USERNAME: Env.schema.string.optional(),
  SMTP3_PASSWORD: Env.schema.string.optional(),

  SMTP4_HOST: Env.schema.string.optional(),
  SMTP4_PORT: Env.schema.number.optional(),
  SMTP4_USERNAME: Env.schema.string.optional(),
  SMTP4_PASSWORD: Env.schema.string.optional(),

  SMTP5_HOST: Env.schema.string.optional(),
  SMTP5_PORT: Env.schema.number.optional(),
  SMTP5_USERNAME: Env.schema.string.optional(),
  SMTP5_PASSWORD: Env.schema.string.optional(),

  SMTP6_HOST: Env.schema.string.optional(),
  SMTP6_PORT: Env.schema.number.optional(),
  SMTP6_USERNAME: Env.schema.string.optional(),
  SMTP6_PASSWORD: Env.schema.string.optional(),

  SMTP7_HOST: Env.schema.string.optional(),
  SMTP7_PORT: Env.schema.number.optional(),
  SMTP7_USERNAME: Env.schema.string.optional(),
  SMTP7_PASSWORD: Env.schema.string.optional(),

  SMTP8_HOST: Env.schema.string.optional(),
  SMTP8_PORT: Env.schema.number.optional(),
  SMTP8_USERNAME: Env.schema.string.optional(),
  SMTP8_PASSWORD: Env.schema.string.optional(),

  SMTP9_HOST: Env.schema.string.optional(),
  SMTP9_PORT: Env.schema.number.optional(),
  SMTP9_USERNAME: Env.schema.string.optional(),
  SMTP9_PASSWORD: Env.schema.string.optional(),

  SMTP10_HOST: Env.schema.string.optional(),
  SMTP10_PORT: Env.schema.number.optional(),
  SMTP10_USERNAME: Env.schema.string.optional(),
  SMTP10_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring SSO bridge
  |----------------------------------------------------------
  */
  API_KEY: Env.schema.string.optional(),
  SSO_PORTAL: Env.schema.string.optional(),
  OBJECTS_HARD_DELETE_AFTER_DAYS: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['fs'] as const)
})
