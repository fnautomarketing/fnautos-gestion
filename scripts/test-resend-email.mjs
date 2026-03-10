#!/usr/bin/env node
/**
 * Envía un correo de prueba con Resend.
 * Ejecutar: node scripts/test-resend-email.mjs
 */
import 'dotenv/config'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Resend } from 'resend'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM || 'Facturación <administracion@stvls.com>'
// Permite sobreescribir el destinatario por variable de entorno TEST_TO para pruebas puntuales
const TO = process.env.TEST_TO || 'administracion@stvls.com'

async function main() {
  if (!API_KEY) {
    console.error('Falta RESEND_API_KEY en .env.local')
    process.exit(1)
  }

  console.log('Enviando correo de prueba a', TO, '...\n')

  const resend = new Resend(API_KEY)
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: '✅ Prueba STVLS ERP - Envío de correo correcto',
    html: `
      <p><strong>¡Funciona!</strong></p>
      <p>Este correo confirma que el envío desde <strong>administracion@stvls.com</strong> está configurado correctamente.</p>
      <p>Las facturas de la app se enviarán desde esta dirección.</p>
      <hr>
      <p style="color:#888;font-size:12px">STVLS ERP - Test automático</p>
    `,
  })

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log('✅ Correo enviado correctamente')
  console.log('   ID:', data?.id)
  console.log('\nRevisa la bandeja de entrada de', TO)
}

main()
