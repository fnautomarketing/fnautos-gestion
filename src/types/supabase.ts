export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author: string | null
          authorImage: string | null
          authorRole: string | null
          category: string
          content: string
          createdAt: string | null
          excerpt: string
          id: string
          image: string | null
          publishedAt: string | null
          readingTimeMinutes: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updatedAt: string | null
          views: number
        }
        Insert: {
          author?: string | null
          authorImage?: string | null
          authorRole?: string | null
          category: string
          content: string
          createdAt?: string | null
          excerpt: string
          id?: string
          image?: string | null
          publishedAt?: string | null
          readingTimeMinutes?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updatedAt?: string | null
          views?: number
        }
        Update: {
          author?: string | null
          authorImage?: string | null
          authorRole?: string | null
          category?: string
          content?: string
          createdAt?: string | null
          excerpt?: string
          id?: string
          image?: string | null
          publishedAt?: string | null
          readingTimeMinutes?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updatedAt?: string | null
          views?: number
        }
        Relationships: []
      }
      cars: {
        Row: {
          brand: string
          color: string | null
          createdAt: string | null
          description: string
          emissionsLabel: string | null
          featured: boolean | null
          fuel: string
          gearbox: string
          id: string
          images: string[] | null
          km: number
          model: string
          power: number | null
          price: number
          priceBadge: string | null
          slug: string
          sold: boolean | null
          status: string | null
          title: string
          updatedAt: string | null
          year: number
        }
        Insert: {
          brand: string
          color?: string | null
          createdAt?: string | null
          description: string
          emissionsLabel?: string | null
          featured?: boolean | null
          fuel: string
          gearbox: string
          id: string
          images?: string[] | null
          km: number
          model: string
          power?: number | null
          price: number
          priceBadge?: string | null
          slug: string
          sold?: boolean | null
          status?: string | null
          title: string
          updatedAt?: string | null
          year: number
        }
        Update: {
          brand?: string
          color?: string | null
          createdAt?: string | null
          description?: string
          emissionsLabel?: string | null
          featured?: boolean | null
          fuel?: string
          gearbox?: string
          id?: string
          images?: string[] | null
          km?: number
          model?: string
          power?: number | null
          price?: number
          priceBadge?: string | null
          slug?: string
          sold?: boolean | null
          status?: string | null
          title?: string
          updatedAt?: string | null
          year?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean | null
          banco: string | null
          bic_swift: string | null
          cif: string
          ciudad: string | null
          codigo_postal: string | null
          created_at: string | null
          descuento_comercial: number | null
          dias_vencimiento: number | null
          direccion: string | null
          email_principal: string | null
          email_secundario: string | null
          empresa_id: string | null
          facturas_emitidas: number | null
          forma_pago_predeterminada: string | null
          iban: string | null
          id: string
          idioma_preferente: string | null
          iva_aplicable: number | null
          nombre_comercial: string | null
          nombre_fiscal: string
          notas_internas: string | null
          pais: string | null
          pendiente_cobro: number | null
          persona_contacto: string | null
          provincia: string | null
          sitio_web: string | null
          tarifa_precios: string | null
          telefono_principal: string | null
          telefono_secundario: string | null
          tipo_cliente: string | null
          titular_cuenta: string | null
          total_facturado: number | null
          ultima_factura_fecha: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          banco?: string | null
          bic_swift?: string | null
          cif: string
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string | null
          descuento_comercial?: number | null
          dias_vencimiento?: number | null
          direccion?: string | null
          email_principal?: string | null
          email_secundario?: string | null
          empresa_id?: string | null
          facturas_emitidas?: number | null
          forma_pago_predeterminada?: string | null
          iban?: string | null
          id?: string
          idioma_preferente?: string | null
          iva_aplicable?: number | null
          nombre_comercial?: string | null
          nombre_fiscal: string
          notas_internas?: string | null
          pais?: string | null
          pendiente_cobro?: number | null
          persona_contacto?: string | null
          provincia?: string | null
          sitio_web?: string | null
          tarifa_precios?: string | null
          telefono_principal?: string | null
          telefono_secundario?: string | null
          tipo_cliente?: string | null
          titular_cuenta?: string | null
          total_facturado?: number | null
          ultima_factura_fecha?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          banco?: string | null
          bic_swift?: string | null
          cif?: string
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string | null
          descuento_comercial?: number | null
          dias_vencimiento?: number | null
          direccion?: string | null
          email_principal?: string | null
          email_secundario?: string | null
          empresa_id?: string | null
          facturas_emitidas?: number | null
          forma_pago_predeterminada?: string | null
          iban?: string | null
          id?: string
          idioma_preferente?: string | null
          iva_aplicable?: number | null
          nombre_comercial?: string | null
          nombre_fiscal?: string
          notas_internas?: string | null
          pais?: string | null
          pendiente_cobro?: number | null
          persona_contacto?: string | null
          provincia?: string | null
          sitio_web?: string | null
          tarifa_precios?: string | null
          telefono_principal?: string | null
          telefono_secundario?: string | null
          tipo_cliente?: string | null
          titular_cuenta?: string | null
          total_facturado?: number | null
          ultima_factura_fecha?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_empresas: {
        Row: {
          cliente_id: string
          created_at: string | null
          empresa_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          empresa_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          empresa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conceptos_catalogo: {
        Row: {
          activo: boolean | null
          categoria: string
          codigo: string
          codigo_interno: string | null
          coste_interno: number | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          empresa_id: string
          id: string
          iva_porcentaje: number | null
          nombre: string
          notas_internas: string | null
          precio_base: number
          proveedor: string | null
          tipo: string | null
          ultima_vez_usado: string | null
          unidad_medida: string | null
          updated_at: string | null
          veces_usado: number | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          codigo: string
          codigo_interno?: string | null
          coste_interno?: number | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          empresa_id: string
          id?: string
          iva_porcentaje?: number | null
          nombre: string
          notas_internas?: string | null
          precio_base: number
          proveedor?: string | null
          tipo?: string | null
          ultima_vez_usado?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
          veces_usado?: number | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          codigo?: string
          codigo_interno?: string | null
          coste_interno?: number | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          empresa_id?: string
          id?: string
          iva_porcentaje?: number | null
          nombre?: string
          notas_internas?: string | null
          precio_base?: number
          proveedor?: string | null
          tipo?: string | null
          ultima_vez_usado?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
          veces_usado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conceptos_catalogo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          clausulas_adicionales: string | null
          cliente_id: string | null
          comprador_ciudad: string | null
          comprador_codigo_postal: string | null
          comprador_direccion: string | null
          comprador_email: string | null
          comprador_nif: string
          comprador_nombre: string
          comprador_telefono: string | null
          creado_por: string | null
          created_at: string
          documentacion_entregada: string[] | null
          empresa_id: string
          estado: string
          firma_comprador_data: string | null
          firma_ip: string | null
          firma_user_agent: string | null
          firma_vendedor_data: string | null
          firmado_en: string | null
          forma_pago: string | null
          id: string
          iva_importe: number | null
          iva_porcentaje: number | null
          notas_internas: string | null
          numero_contrato: string
          pdf_borrador_url: string | null
          pdf_firmado_url: string | null
          precio_letras: string | null
          precio_venta: number
          tipo_operacion: string
          token_firma: string | null
          token_firma_expira: string | null
          total_con_iva: number | null
          updated_at: string
          vehiculo_bastidor: string
          vehiculo_color: string | null
          vehiculo_combustible: string | null
          vehiculo_estado_declarado: string | null
          vehiculo_fecha_matriculacion: string | null
          vehiculo_kilometraje: number | null
          vehiculo_libre_cargas: boolean | null
          vehiculo_marca: string
          vehiculo_matricula: string
          vehiculo_modelo: string
          vehiculo_version: string | null
          vendedor_ciudad: string | null
          vendedor_codigo_postal: string | null
          vendedor_direccion: string | null
          vendedor_email: string | null
          vendedor_nif: string
          vendedor_nombre: string
          vendedor_telefono: string | null
        }
        Insert: {
          clausulas_adicionales?: string | null
          cliente_id?: string | null
          comprador_ciudad?: string | null
          comprador_codigo_postal?: string | null
          comprador_direccion?: string | null
          comprador_email?: string | null
          comprador_nif: string
          comprador_nombre: string
          comprador_telefono?: string | null
          creado_por?: string | null
          created_at?: string
          documentacion_entregada?: string[] | null
          empresa_id: string
          estado?: string
          firma_comprador_data?: string | null
          firma_ip?: string | null
          firma_user_agent?: string | null
          firma_vendedor_data?: string | null
          firmado_en?: string | null
          forma_pago?: string | null
          id?: string
          iva_importe?: number | null
          iva_porcentaje?: number | null
          notas_internas?: string | null
          numero_contrato: string
          pdf_borrador_url?: string | null
          pdf_firmado_url?: string | null
          precio_letras?: string | null
          precio_venta: number
          tipo_operacion: string
          token_firma?: string | null
          token_firma_expira?: string | null
          total_con_iva?: number | null
          updated_at?: string
          vehiculo_bastidor: string
          vehiculo_color?: string | null
          vehiculo_combustible?: string | null
          vehiculo_estado_declarado?: string | null
          vehiculo_fecha_matriculacion?: string | null
          vehiculo_kilometraje?: number | null
          vehiculo_libre_cargas?: boolean | null
          vehiculo_marca: string
          vehiculo_matricula: string
          vehiculo_modelo: string
          vehiculo_version?: string | null
          vendedor_ciudad?: string | null
          vendedor_codigo_postal?: string | null
          vendedor_direccion?: string | null
          vendedor_email?: string | null
          vendedor_nif: string
          vendedor_nombre: string
          vendedor_telefono?: string | null
        }
        Update: {
          clausulas_adicionales?: string | null
          cliente_id?: string | null
          comprador_ciudad?: string | null
          comprador_codigo_postal?: string | null
          comprador_direccion?: string | null
          comprador_email?: string | null
          comprador_nif?: string
          comprador_nombre?: string
          comprador_telefono?: string | null
          creado_por?: string | null
          created_at?: string
          documentacion_entregada?: string[] | null
          empresa_id?: string
          estado?: string
          firma_comprador_data?: string | null
          firma_ip?: string | null
          firma_user_agent?: string | null
          firma_vendedor_data?: string | null
          firmado_en?: string | null
          forma_pago?: string | null
          id?: string
          iva_importe?: number | null
          iva_porcentaje?: number | null
          notas_internas?: string | null
          numero_contrato?: string
          pdf_borrador_url?: string | null
          pdf_firmado_url?: string | null
          precio_letras?: string | null
          precio_venta?: number
          tipo_operacion?: string
          token_firma?: string | null
          token_firma_expira?: string | null
          total_con_iva?: number | null
          updated_at?: string
          vehiculo_bastidor?: string
          vehiculo_color?: string | null
          vehiculo_combustible?: string | null
          vehiculo_estado_declarado?: string | null
          vehiculo_fecha_matriculacion?: string | null
          vehiculo_kilometraje?: number | null
          vehiculo_libre_cargas?: boolean | null
          vehiculo_marca?: string
          vehiculo_matricula?: string
          vehiculo_modelo?: string
          vehiculo_version?: string | null
          vendedor_ciudad?: string | null
          vendedor_codigo_postal?: string | null
          vendedor_direccion?: string | null
          vendedor_email?: string | null
          vendedor_nif?: string
          vendedor_nombre?: string
          vendedor_telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_factura: {
        Row: {
          asunto: string
          cc: string[] | null
          created_at: string | null
          empresa_id: string
          enviado_at: string | null
          error_mensaje: string | null
          estado: string
          factura_id: string
          id: string
          incluir_logo: boolean | null
          mensaje: string
          para: string[]
          plantilla: string | null
          proveedor_mensaje_id: string | null
        }
        Insert: {
          asunto: string
          cc?: string[] | null
          created_at?: string | null
          empresa_id: string
          enviado_at?: string | null
          error_mensaje?: string | null
          estado?: string
          factura_id: string
          id?: string
          incluir_logo?: boolean | null
          mensaje: string
          para: string[]
          plantilla?: string | null
          proveedor_mensaje_id?: string | null
        }
        Update: {
          asunto?: string
          cc?: string[] | null
          created_at?: string | null
          empresa_id?: string
          enviado_at?: string | null
          error_mensaje?: string | null
          estado?: string
          factura_id?: string
          id?: string
          incluir_logo?: boolean | null
          mensaje?: string
          para?: string[]
          plantilla?: string | null
          proveedor_mensaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_factura_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_factura_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_factura_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "vista_facturas_vencidas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activo: boolean | null
          aplica_recargo_equivalencia: boolean | null
          banco: string | null
          cif: string
          ciudad: string | null
          clausulas_generales: string | null
          codigo_postal: string | null
          created_at: string | null
          deleted_at: string | null
          dias_pago_predeterminados: number | null
          direccion: string | null
          email: string | null
          firma_url: string | null
          formato_fecha: string | null
          formato_numero_factura: string | null
          iban: string | null
          id: string
          idioma_predeterminado: string | null
          iva_predeterminado: number | null
          latitud: number | null
          logo_filename: string | null
          logo_url: string | null
          longitud: number | null
          lugar_expedicion: string | null
          nombre_comercial: string | null
          pais: string | null
          pie_factura: string | null
          plantilla_pdf_predeterminada_id: string | null
          prefijo_serie: string | null
          provincia: string | null
          razon_social: string
          recargo_porcentaje: number | null
          regimen_iva: string | null
          retencion_predeterminada: number | null
          separador_decimales: string | null
          separador_miles: string | null
          serie_predeterminada_id: string | null
          swift: string | null
          telefono: string | null
          tipo_empresa: string | null
          titular_cuenta: string | null
          updated_at: string | null
          web: string | null
          zona_horaria: string | null
        }
        Insert: {
          activo?: boolean | null
          aplica_recargo_equivalencia?: boolean | null
          banco?: string | null
          cif: string
          ciudad?: string | null
          clausulas_generales?: string | null
          codigo_postal?: string | null
          created_at?: string | null
          deleted_at?: string | null
          dias_pago_predeterminados?: number | null
          direccion?: string | null
          email?: string | null
          firma_url?: string | null
          formato_fecha?: string | null
          formato_numero_factura?: string | null
          iban?: string | null
          id?: string
          idioma_predeterminado?: string | null
          iva_predeterminado?: number | null
          latitud?: number | null
          logo_filename?: string | null
          logo_url?: string | null
          longitud?: number | null
          lugar_expedicion?: string | null
          nombre_comercial?: string | null
          pais?: string | null
          pie_factura?: string | null
          plantilla_pdf_predeterminada_id?: string | null
          prefijo_serie?: string | null
          provincia?: string | null
          razon_social: string
          recargo_porcentaje?: number | null
          regimen_iva?: string | null
          retencion_predeterminada?: number | null
          separador_decimales?: string | null
          separador_miles?: string | null
          serie_predeterminada_id?: string | null
          swift?: string | null
          telefono?: string | null
          tipo_empresa?: string | null
          titular_cuenta?: string | null
          updated_at?: string | null
          web?: string | null
          zona_horaria?: string | null
        }
        Update: {
          activo?: boolean | null
          aplica_recargo_equivalencia?: boolean | null
          banco?: string | null
          cif?: string
          ciudad?: string | null
          clausulas_generales?: string | null
          codigo_postal?: string | null
          created_at?: string | null
          deleted_at?: string | null
          dias_pago_predeterminados?: number | null
          direccion?: string | null
          email?: string | null
          firma_url?: string | null
          formato_fecha?: string | null
          formato_numero_factura?: string | null
          iban?: string | null
          id?: string
          idioma_predeterminado?: string | null
          iva_predeterminado?: number | null
          latitud?: number | null
          logo_filename?: string | null
          logo_url?: string | null
          longitud?: number | null
          lugar_expedicion?: string | null
          nombre_comercial?: string | null
          pais?: string | null
          pie_factura?: string | null
          plantilla_pdf_predeterminada_id?: string | null
          prefijo_serie?: string | null
          provincia?: string | null
          razon_social?: string
          recargo_porcentaje?: number | null
          regimen_iva?: string | null
          retencion_predeterminada?: number | null
          separador_decimales?: string | null
          separador_miles?: string | null
          serie_predeterminada_id?: string | null
          swift?: string | null
          telefono?: string | null
          tipo_empresa?: string | null
          titular_cuenta?: string | null
          updated_at?: string | null
          web?: string | null
          zona_horaria?: string | null
        }
        Relationships: []
      }
      eventos_factura: {
        Row: {
          created_at: string | null
          datos_adicionales: Json | null
          descripcion: string | null
          factura_id: string
          id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          datos_adicionales?: Json | null
          descripcion?: string | null
          factura_id: string
          id?: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          datos_adicionales?: Json | null
          descripcion?: string | null
          factura_id?: string
          id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_factura_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_factura_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "vista_facturas_vencidas"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          archivo_url: string | null
          base_imponible: number
          cliente_id: string
          created_at: string | null
          descuento: number | null
          descuento_tipo: string | null
          descuento_valor: number | null
          divisa: string | null
          empresa_id: string
          es_externa: boolean | null
          es_rectificativa: boolean | null
          estado: string
          factura_rectificada_id: string | null
          fecha_emision: string
          fecha_pago: string | null
          fecha_vencimiento: string
          id: string
          importe_descuento: number | null
          importe_recargo: number | null
          importe_retencion: number | null
          iva: number
          motivo_rectificacion: string | null
          notas: string | null
          numero: string
          numero_manual: string | null
          numero_orden: number | null
          pagado: number | null
          plantilla_pdf_id: string | null
          recargo_equivalencia: boolean | null
          recargo_porcentaje: number | null
          retencion_porcentaje: number | null
          serie: string | null
          serie_id: string | null
          subtotal: number
          tipo_cambio: number | null
          tipo_rectificativa: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          archivo_url?: string | null
          base_imponible?: number
          cliente_id: string
          created_at?: string | null
          descuento?: number | null
          descuento_tipo?: string | null
          descuento_valor?: number | null
          divisa?: string | null
          empresa_id: string
          es_externa?: boolean | null
          es_rectificativa?: boolean | null
          estado?: string
          factura_rectificada_id?: string | null
          fecha_emision: string
          fecha_pago?: string | null
          fecha_vencimiento: string
          id?: string
          importe_descuento?: number | null
          importe_recargo?: number | null
          importe_retencion?: number | null
          iva?: number
          motivo_rectificacion?: string | null
          notas?: string | null
          numero: string
          numero_manual?: string | null
          numero_orden?: number | null
          pagado?: number | null
          plantilla_pdf_id?: string | null
          recargo_equivalencia?: boolean | null
          recargo_porcentaje?: number | null
          retencion_porcentaje?: number | null
          serie?: string | null
          serie_id?: string | null
          subtotal?: number
          tipo_cambio?: number | null
          tipo_rectificativa?: string | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          archivo_url?: string | null
          base_imponible?: number
          cliente_id?: string
          created_at?: string | null
          descuento?: number | null
          descuento_tipo?: string | null
          descuento_valor?: number | null
          divisa?: string | null
          empresa_id?: string
          es_externa?: boolean | null
          es_rectificativa?: boolean | null
          estado?: string
          factura_rectificada_id?: string | null
          fecha_emision?: string
          fecha_pago?: string | null
          fecha_vencimiento?: string
          id?: string
          importe_descuento?: number | null
          importe_recargo?: number | null
          importe_retencion?: number | null
          iva?: number
          motivo_rectificacion?: string | null
          notas?: string | null
          numero?: string
          numero_manual?: string | null
          numero_orden?: number | null
          pagado?: number | null
          plantilla_pdf_id?: string | null
          recargo_equivalencia?: boolean | null
          recargo_porcentaje?: number | null
          retencion_porcentaje?: number | null
          serie?: string | null
          serie_id?: string | null
          subtotal?: number
          tipo_cambio?: number | null
          tipo_rectificativa?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_factura_rectificada_id_fkey"
            columns: ["factura_rectificada_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_factura_rectificada_id_fkey"
            columns: ["factura_rectificada_id"]
            isOneToOne: false
            referencedRelation: "vista_facturas_vencidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_plantilla_pdf_id_fkey"
            columns: ["plantilla_pdf_id"]
            isOneToOne: false
            referencedRelation: "plantillas_pdf"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "series_facturacion"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          carId: string | null
          createdAt: string | null
          email: string | null
          id: string
          message: string
          name: string
          phone: string
          source: string | null
          status: string | null
        }
        Insert: {
          carId?: string | null
          createdAt?: string | null
          email?: string | null
          id: string
          message: string
          name: string
          phone: string
          source?: string | null
          status?: string | null
        }
        Update: {
          carId?: string | null
          createdAt?: string | null
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_car"
            columns: ["carId"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      lineas_factura: {
        Row: {
          cantidad: number
          concepto: string
          concepto_id: string | null
          created_at: string | null
          descripcion: string | null
          descuento_porcentaje: number | null
          factura_id: string
          id: string
          iva_porcentaje: number
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad?: number
          concepto: string
          concepto_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          descuento_porcentaje?: number | null
          factura_id: string
          id?: string
          iva_porcentaje?: number
          precio_unitario: number
          subtotal: number
        }
        Update: {
          cantidad?: number
          concepto?: string
          concepto_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          descuento_porcentaje?: number | null
          factura_id?: string
          id?: string
          iva_porcentaje?: number
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "lineas_factura_concepto_id_fkey"
            columns: ["concepto_id"]
            isOneToOne: false
            referencedRelation: "conceptos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineas_factura_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineas_factura_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "vista_facturas_vencidas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          categoria: string
          created_at: string | null
          empresa_id: string | null
          enlace: string | null
          id: string
          leida: boolean | null
          mensaje: string
          metadata: Json | null
          tipo: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          empresa_id?: string | null
          enlace?: string | null
          id?: string
          leida?: boolean | null
          mensaje: string
          metadata?: Json | null
          tipo?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          empresa_id?: string | null
          enlace?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string
          metadata?: Json | null
          tipo?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          anulado: boolean | null
          comprobante_url: string | null
          conciliado: boolean | null
          creado_por: string | null
          created_at: string | null
          cuenta_bancaria: string | null
          empresa_id: string
          factura_id: string
          fecha_anulacion: string | null
          fecha_conciliacion: string | null
          fecha_pago: string
          id: string
          importe: number
          metodo_pago: string
          motivo_anulacion: string | null
          notas: string | null
          referencia: string | null
          updated_at: string | null
        }
        Insert: {
          anulado?: boolean | null
          comprobante_url?: string | null
          conciliado?: boolean | null
          creado_por?: string | null
          created_at?: string | null
          cuenta_bancaria?: string | null
          empresa_id: string
          factura_id: string
          fecha_anulacion?: string | null
          fecha_conciliacion?: string | null
          fecha_pago: string
          id?: string
          importe: number
          metodo_pago: string
          motivo_anulacion?: string | null
          notas?: string | null
          referencia?: string | null
          updated_at?: string | null
        }
        Update: {
          anulado?: boolean | null
          comprobante_url?: string | null
          conciliado?: boolean | null
          creado_por?: string | null
          created_at?: string | null
          cuenta_bancaria?: string | null
          empresa_id?: string
          factura_id?: string
          fecha_anulacion?: string | null
          fecha_conciliacion?: string | null
          fecha_pago?: string
          id?: string
          importe?: number
          metodo_pago?: string
          motivo_anulacion?: string | null
          notas?: string | null
          referencia?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "vista_facturas_vencidas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          id: string
          rol: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          rol?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          rol?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_pdf: {
        Row: {
          activa: boolean | null
          alternar_color_filas: boolean | null
          color_encabezado_tabla: string | null
          color_primario: string | null
          color_secundario: string | null
          created_at: string | null
          descripcion: string | null
          empresa_id: string
          facturas_generadas: number | null
          fuente: string | null
          id: string
          idiomas: Json | null
          logo_alto: number | null
          logo_ancho: number | null
          logo_posicion: string | null
          logo_url: string | null
          mostrar_datos_bancarios: boolean | null
          mostrar_fecha_emision: boolean | null
          mostrar_fecha_vencimiento: boolean | null
          mostrar_firma: boolean | null
          mostrar_notas: boolean | null
          mostrar_numero_factura: boolean | null
          mostrar_qr_pago: boolean | null
          mostrar_sello: boolean | null
          nombre: string
          predeterminada: boolean | null
          tamano_fuente_base: number | null
          texto_cabecera: string | null
          texto_pie: string | null
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          alternar_color_filas?: boolean | null
          color_encabezado_tabla?: string | null
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id: string
          facturas_generadas?: number | null
          fuente?: string | null
          id?: string
          idiomas?: Json | null
          logo_alto?: number | null
          logo_ancho?: number | null
          logo_posicion?: string | null
          logo_url?: string | null
          mostrar_datos_bancarios?: boolean | null
          mostrar_fecha_emision?: boolean | null
          mostrar_fecha_vencimiento?: boolean | null
          mostrar_firma?: boolean | null
          mostrar_notas?: boolean | null
          mostrar_numero_factura?: boolean | null
          mostrar_qr_pago?: boolean | null
          mostrar_sello?: boolean | null
          nombre: string
          predeterminada?: boolean | null
          tamano_fuente_base?: number | null
          texto_cabecera?: string | null
          texto_pie?: string | null
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          alternar_color_filas?: boolean | null
          color_encabezado_tabla?: string | null
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string
          facturas_generadas?: number | null
          fuente?: string | null
          id?: string
          idiomas?: Json | null
          logo_alto?: number | null
          logo_ancho?: number | null
          logo_posicion?: string | null
          logo_url?: string | null
          mostrar_datos_bancarios?: boolean | null
          mostrar_fecha_emision?: boolean | null
          mostrar_fecha_vencimiento?: boolean | null
          mostrar_firma?: boolean | null
          mostrar_notas?: boolean | null
          mostrar_numero_factura?: boolean | null
          mostrar_qr_pago?: boolean | null
          mostrar_sello?: boolean | null
          nombre?: string
          predeterminada?: boolean | null
          tamano_fuente_base?: number | null
          texto_cabecera?: string | null
          texto_pie?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_pdf_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_recordatorio: {
        Row: {
          activa: boolean | null
          asunto: string | null
          codigo: string
          contenido: string
          created_at: string | null
          empresa_id: string
          id: string
          nombre: string
          predeterminada: boolean | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          asunto?: string | null
          codigo: string
          contenido: string
          created_at?: string | null
          empresa_id: string
          id?: string
          nombre: string
          predeterminada?: boolean | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          asunto?: string | null
          codigo?: string
          contenido?: string
          created_at?: string | null
          empresa_id?: string
          id?: string
          nombre?: string
          predeterminada?: boolean | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_recordatorio_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      recordatorios: {
        Row: {
          adjuntar_factura: boolean | null
          adjuntos_adicionales: string[] | null
          asunto: string | null
          contenido: string | null
          creado_por: string | null
          created_at: string | null
          email_destinatario: string | null
          emails_cc: string[] | null
          empresa_id: string
          estado: string | null
          factura_id: string
          fecha_apertura: string | null
          fecha_compromiso_pago: string | null
          fecha_envio: string | null
          fecha_programado: string | null
          id: string
          notas: string | null
          persona_contactada: string | null
          plantilla: string | null
          resultado_llamada: string | null
          siguiente_accion: string | null
          telefono_destinatario: string | null
          tipo: string
          tono: string | null
          updated_at: string | null
        }
        Insert: {
          adjuntar_factura?: boolean | null
          adjuntos_adicionales?: string[] | null
          asunto?: string | null
          contenido?: string | null
          creado_por?: string | null
          created_at?: string | null
          email_destinatario?: string | null
          emails_cc?: string[] | null
          empresa_id: string
          estado?: string | null
          factura_id: string
          fecha_apertura?: string | null
          fecha_compromiso_pago?: string | null
          fecha_envio?: string | null
          fecha_programado?: string | null
          id?: string
          notas?: string | null
          persona_contactada?: string | null
          plantilla?: string | null
          resultado_llamada?: string | null
          siguiente_accion?: string | null
          telefono_destinatario?: string | null
          tipo: string
          tono?: string | null
          updated_at?: string | null
        }
        Update: {
          adjuntar_factura?: boolean | null
          adjuntos_adicionales?: string[] | null
          asunto?: string | null
          contenido?: string | null
          creado_por?: string | null
          created_at?: string | null
          email_destinatario?: string | null
          emails_cc?: string[] | null
          empresa_id?: string
          estado?: string | null
          factura_id?: string
          fecha_apertura?: string | null
          fecha_compromiso_pago?: string | null
          fecha_envio?: string | null
          fecha_programado?: string | null
          id?: string
          notas?: string | null
          persona_contactada?: string | null
          plantilla?: string | null
          resultado_llamada?: string | null
          siguiente_accion?: string | null
          telefono_destinatario?: string | null
          tipo?: string
          tono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recordatorios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorios_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorios_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "vista_facturas_vencidas"
            referencedColumns: ["id"]
          },
        ]
      }
      series_facturacion: {
        Row: {
          activa: boolean | null
          codigo: string
          created_at: string | null
          descripcion: string | null
          digitos: number | null
          empresa_id: string
          facturas_emitidas: number | null
          icono: string | null
          id: string
          nombre: string
          numero_actual: number
          numero_inicial: number
          predeterminada: boolean | null
          prefijo: string | null
          reseteo: string | null
          sufijo: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          digitos?: number | null
          empresa_id: string
          facturas_emitidas?: number | null
          icono?: string | null
          id?: string
          nombre: string
          numero_actual?: number
          numero_inicial?: number
          predeterminada?: boolean | null
          prefijo?: string | null
          reseteo?: string | null
          sufijo?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          digitos?: number | null
          empresa_id?: string
          facturas_emitidas?: number | null
          icono?: string | null
          id?: string
          nombre?: string
          numero_actual?: number
          numero_inicial?: number
          predeterminada?: boolean | null
          prefijo?: string | null
          reseteo?: string | null
          sufijo?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_facturacion_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_sessions: {
        Row: {
          chat_id: number
          state: Json
          updated_at: string
        }
        Insert: {
          chat_id: number
          state?: Json
          updated_at?: string
        }
        Update: {
          chat_id?: number
          state?: Json
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          createdAt: string | null
          email: string
          id: string
          role: string | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          email: string
          id: string
          role?: string | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string
          id?: string
          role?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      usuarios_empresas: {
        Row: {
          created_at: string | null
          empresa_activa: boolean | null
          empresa_id: string
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_activa?: boolean | null
          empresa_id: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          rol?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_activa?: boolean | null
          empresa_id?: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_estadisticas_ventas: {
        Row: {
          cobrado: number | null
          dias_cobro_promedio: number | null
          empresa_id: string | null
          facturacion_total: number | null
          num_clientes: number | null
          num_facturas: number | null
          pendiente: number | null
          periodo: string | null
          ticket_medio: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_facturas_vencidas: {
        Row: {
          archivo_url: string | null
          base_imponible: number | null
          cliente_email: string | null
          cliente_id: string | null
          cliente_nombre: string | null
          cliente_telefono: string | null
          created_at: string | null
          descuento: number | null
          descuento_tipo: string | null
          descuento_valor: number | null
          dias_vencido: number | null
          divisa: string | null
          empresa_id: string | null
          es_externa: boolean | null
          es_rectificativa: boolean | null
          estado: string | null
          factura_rectificada_id: string | null
          fecha_emision: string | null
          fecha_pago: string | null
          fecha_ultimo_recordatorio: string | null
          fecha_vencimiento: string | null
          id: string | null
          importe_descuento: number | null
          importe_recargo: number | null
          importe_retencion: number | null
          iva: number | null
          motivo_rectificacion: string | null
          nivel_criticidad: string | null
          notas: string | null
          num_recordatorios_enviados: number | null
          numero: string | null
          numero_manual: string | null
          numero_orden: number | null
          pagado: number | null
          pendiente: number | null
          plantilla_pdf_id: string | null
          recargo_equivalencia: boolean | null
          recargo_porcentaje: number | null
          retencion_porcentaje: number | null
          serie: string | null
          serie_id: string | null
          subtotal: number | null
          tipo_cambio: number | null
          tipo_rectificativa: string | null
          total: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_factura_rectificada_id_fkey"
            columns: ["factura_rectificada_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_factura_rectificada_id_fkey"
            columns: ["factura_rectificada_id"]
            isOneToOne: false
            referencedRelation: "vista_facturas_vencidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_plantilla_pdf_id_fkey"
            columns: ["plantilla_pdf_id"]
            isOneToOne: false
            referencedRelation: "plantillas_pdf"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "series_facturacion"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      actualizar_total_pagado: {
        Args: { p_factura_id: string }
        Returns: undefined
      }
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      get_desglose_iva: {
        Args: {
          p_cliente_id?: string
          p_empresa_id: string
          p_fecha_desde?: string
          p_fecha_hasta?: string
        }
        Returns: Json
      }
      get_estado_facturas: {
        Args: {
          p_cliente_id?: string
          p_empresa_id?: string
          p_fecha_desde?: string
          p_fecha_hasta?: string
        }
        Returns: Json
      }
      get_evolucion_facturacion: {
        Args: {
          p_cliente_id?: string
          p_empresa_id: string
          p_fecha_desde?: string
          p_fecha_hasta?: string
        }
        Returns: Json
      }
      get_kpis_ventas: {
        Args: {
          p_cliente_id?: string
          p_empresa_id: string
          p_fecha_desde?: string
          p_fecha_hasta?: string
        }
        Returns: Json
      }
      liberar_numero_serie: { Args: { p_serie_id: string }; Returns: undefined }
      obtener_proximo_numero_preview: {
        Args: { p_serie_id: string }
        Returns: string
      }
      obtener_siguiente_numero_serie: {
        Args: { p_serie_id: string }
        Returns: string
      }
      validar_cif_espanol: { Args: { p_cif: string }; Returns: boolean }
      validar_iban: { Args: { p_iban: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
