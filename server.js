const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
// server.js
const PORT = process.env.PORT || 3000; // Usa el puerto que asigna Render o el 3000 localmente

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const cotizacionesFile = path.join(dataDir, 'cotizaciones.json');

function guardarCotizacion(cotizacion) {
    let cotizaciones = [];
    if (fs.existsSync(cotizacionesFile)) {
        const data = fs.readFileSync(cotizacionesFile, 'utf8');
        cotizaciones = JSON.parse(data);
    }
    cotizacion.id = Date.now();
    cotizacion.fecha = new Date().toISOString();
    cotizaciones.push(cotizacion);
    fs.writeFileSync(cotizacionesFile, JSON.stringify(cotizaciones, null, 2));
    return cotizacion;
}

function obtenerPrecio(m2, tipoLimpieza, accesorios) {
    const precios = {
        'basica': {
            '40-59': { con: 136, sin: 125 },
            '60-79': { con: 148, sin: 135 },
            '80-97': { con: 186, sin: 165 },
            '97+': { con: 198, sin: 175 }
        },
        'profunda': {
            '40-59': { con: 158, sin: 138 },
            '60-79': { con: 168, sin: 146 },
            '80-97': { con: 196, sin: 175 },
            '97+': { con: 226, sin: 210 }
        }
    };

    let rango;
    if (m2 >= 40 && m2 <= 59) rango = '40-59';
    else if (m2 >= 60 && m2 <= 79) rango = '60-79';
    else if (m2 >= 80 && m2 <= 97) rango = '80-97';
    else if (m2 > 97) rango = '97+';
    else return null;

    const precioData = precios[tipoLimpieza][rango];
    return accesorios === 'con' ? precioData.con : precioData.sin;
}

app.post('/api/cotizar', (req, res) => {
    const { m2, ambientes, banos, amoblado, mascota, tipoLimpieza, accesorios } = req.body;

    // Validación
    if (!m2 || !ambientes || amoblado === undefined || !tipoLimpieza || !accesorios) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const metros = parseFloat(m2);
    if (isNaN(metros) || metros < 40) {
        return res.status(400).json({ error: 'El área mínima es de 40 m²' });
    }

    // Asegurar que banos tenga un valor válido
    let banosValue = parseInt(banos);
    if (isNaN(banosValue) || banosValue < 0) {
        banosValue = 0;
    }

    // Calcular precio base
    let precio = obtenerPrecio(metros, tipoLimpieza, accesorios);
    
    if (!precio) {
        return res.status(400).json({ error: 'Rango no válido' });
    }

    // Agregar extra por mascota (S/6) - la lógica sigue funcionando aunque no se muestre el texto
    let mascotaValue = mascota === 'si' ? 'si' : 'no';
    let extraMascota = 0;
    if (mascotaValue === 'si') {
        extraMascota = 6;
        precio += extraMascota;
    }

    const cotizacion = {
        metros: metros,
        ambientes: parseInt(ambientes),
        banos: banosValue,
        amoblado: amoblado === 'si',
        mascota: mascotaValue,
        extraMascota: extraMascota,
        tipoLimpieza,
        accesorios,
        precio,
        mensajeWhatsApp: metros > 97 ? 'Para áreas mayores a 97m², contáctanos para un presupuesto personalizado' : null
    };

    const guardada = guardarCotizacion(cotizacion);
    res.json({ cotizacion: guardada, precio });
});

app.get('/api/cotizaciones', (req, res) => {
    if (fs.existsSync(cotizacionesFile)) {
        const data = fs.readFileSync(cotizacionesFile, 'utf8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor EcoClean corriendo en http://localhost:${PORT}`);
});