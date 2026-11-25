const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Usuario, Rol, Carrera } = require('../models');
const { SECRET_KEY } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================
// LOGIN
// ============================================================
const login = async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = (email || username || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ mensaje: 'Correo electronico y contrasena son requeridos' });
  }

  try {
    const user = await Usuario.findOne({
      where: {
        [Op.or]: [
          { email: { [Op.iLike]: identifier } },
          { email: { [Op.iLike]: `${identifier}@%` } }
        ]
      },
      include: [
        { model: Rol, as: 'rol' },
        { model: Carrera, as: 'carrera' }
      ]
    });

    if (!user) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    if (!user.activo) {
      return res.status(401).json({ mensaje: 'Usuario inactivo. Contacte al administrador.' });
    }

    // Verificar si el correo fue confirmado
    if (user.is_verified === false) {
      return res.status(403).json({
        mensaje: 'Tu correo electronico aun no ha sido verificado. Revisa tu bandeja de entrada y haz clic en el enlace de confirmacion.',
        no_verificado: true
      });
    }

    const valid = await user.verificarPassword(password);
    if (!valid) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    await user.update({ ultimo_acceso: new Date() });

    const roleName = user.rol?.nombre || 'usuario';
    const payload = {
      id: user.id_usuario,
      email: user.email,
      rol: roleName,
      id_carrera: user.id_carrera
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '12h' });

    return res.json({
      token,
      user: {
        id: user.id_usuario,
        email: user.email,
        username: user.email.split('@')[0],
        nombre: user.nombre,
        rol: roleName,
        cargo: roleName,
        carrera: user.carrera?.nombre || 'Ingenieria de Sistemas',
        id_carrera: user.id_carrera
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ mensaje: 'Error del servidor al procesar inicio de sesion' });
  }
};

// ============================================================
// REGISTER  (con verificacion por correo)
// ============================================================
const register = async (req, res) => {
  const { email, username, password, nombre, rol, id_rol, id_carrera, cargo, carrera } = req.body;
  const finalEmail = (email || (username ? (username.includes('@') ? username : `${username}@uagrm.edu.bo`) : '')).trim();

  if (!finalEmail || !password || !nombre) {
    return res.status(400).json({ mensaje: 'Correo electronico, contrasena y nombre son requeridos' });
  }

  if (password.length < 6) {
    return res.status(400).json({ mensaje: 'La contrasena debe tener al menos 6 caracteres' });
  }

  try {
    const existe = await Usuario.findOne({ where: { email: { [Op.iLike]: finalEmail } } });
    if (existe) {
      return res.status(400).json({ mensaje: 'El correo electronico ya esta registrado' });
    }

    // Resolver rol
    let resolvedRolId = id_rol;
    if (!resolvedRolId) {
      const targetRol = (rol || cargo || 'director').toLowerCase();
      const rolRecord = await Rol.findOne({ where: { nombre: targetRol } })
                     || await Rol.findOne({ where: { nombre: 'director' } });
      resolvedRolId = rolRecord ? rolRecord.id_rol : null;
    }

    // Resolver carrera
    let resolvedCarreraId = id_carrera;
    if (!resolvedCarreraId && carrera) {
      const carreraRecord = await Carrera.findOne({ where: { nombre: { [Op.iLike]: `%${carrera}%` } } });
      if (carreraRecord) resolvedCarreraId = carreraRecord.id_carrera;
    }
    if (!resolvedCarreraId) {
      const carreraRecord = await Carrera.findOne({ where: { nombre: 'Ingenieria de Sistemas' } })
                         || await Carrera.findOne();
      resolvedCarreraId = carreraRecord ? carreraRecord.id_carrera : null;
    }

    if (!resolvedRolId || !resolvedCarreraId) {
      return res.status(500).json({ mensaje: 'No se pudo asignar rol o carrera predeterminada' });
    }

    // Generar token de verificacion
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await Usuario.create({
      email: finalEmail,
      password_hash: password,
      nombre: nombre.trim(),
      id_rol: resolvedRolId,
      id_carrera: resolvedCarreraId,
      activo: true,
      is_verified: false,
      verification_token: verificationToken
    });

    // Enviar correo de verificacion
    const verifyUrl = `${FRONTEND_URL}/verificar-correo?token=${verificationToken}`;
    const emailResult = await sendEmail({
      to: finalEmail,
      subject: 'Confirma tu cuenta - SIGAD FINI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0b2545; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #c1121f;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 1px;">SIGAD - DIRECCION DE CARRERA FINI</h2>
            <p style="margin: 5px 0 0; color: #c5a059; font-size: 13px;">Universidad Autonoma Gabriel Rene Moreno</p>
          </div>
          <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Hola, ${nombre.trim()}!</h3>
            <p>Gracias por registrarte en el Sistema de Archivo y Gestion Documental (SIGAD) de la Facultad Integral de Ichilo.</p>
            <p>Para activar tu cuenta, por favor haz clic en el siguiente boton:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
                Confirmar mi Correo
              </a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Si el boton no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">${verifyUrl}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">Si tu no creaste esta cuenta, puedes ignorar este mensaje.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            UAGRM &mdash; Facultad Integral del Ichilo &middot; Yapacani, Santa Cruz, Bolivia
          </div>
        </div>
      `,
      text: `Hola ${nombre.trim()}, confirma tu cuenta visitando: ${verifyUrl}`
    });

    const mensajeBase = 'Cuenta creada exitosamente. Revisa tu correo electronico para confirmar tu cuenta.';
    const mensajeFinal = emailResult.ok
      ? mensajeBase
      : mensajeBase + ' (Nota: el correo de confirmacion no se pudo enviar. Contacta al administrador.)';

    return res.status(201).json({
      mensaje: mensajeFinal,
      user: {
        id: newUser.id_usuario,
        email: newUser.email,
        nombre: newUser.nombre
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ mensaje: 'Error del servidor al registrar usuario' });
  }
};

// ============================================================
// VERIFICAR CORREO ELECTRONICO
// ============================================================
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ mensaje: 'Token de verificacion no proporcionado', ok: false });
  }

  try {
    const user = await Usuario.findOne({ where: { verification_token: token } });

    if (!user) {
      return res.status(400).json({ mensaje: 'Token de verificacion invalido o ya utilizado', ok: false });
    }

    if (user.is_verified) {
      return res.json({ mensaje: 'Tu correo ya fue verificado anteriormente. Ya puedes iniciar sesion.', ok: true });
    }

    await user.update({
      is_verified: true,
      verification_token: null
    });

    return res.json({
      mensaje: 'Correo electronico verificado exitosamente. Ya puedes iniciar sesion.',
      ok: true
    });
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ mensaje: 'Error del servidor al verificar correo', ok: false });
  }
};

// ============================================================
// REENVIAR CORREO DE VERIFICACION
// ============================================================
const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ mensaje: 'Correo electronico requerido' });
  }

  try {
    const user = await Usuario.findOne({ where: { email: { [Op.iLike]: email.trim() } } });
    if (!user) {
      return res.json({ mensaje: 'Si el correo esta registrado, se reenviara el enlace de verificacion.' });
    }

    if (user.is_verified) {
      return res.json({ mensaje: 'Tu correo ya esta verificado. Puedes iniciar sesion normalmente.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await user.update({ verification_token: verificationToken });

    const verifyUrl = `${FRONTEND_URL}/verificar-correo?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Confirma tu cuenta - SIGAD FINI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0b2545; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #c1121f;">
            <h2 style="margin: 0; font-size: 20px;">SIGAD - DIRECCION DE CARRERA FINI</h2>
          </div>
          <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Hola, ${user.nombre}!</h3>
            <p>Has solicitado reenviar el enlace de verificacion. Haz clic en el boton para confirmar tu correo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
                Confirmar mi Correo
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Confirma tu cuenta: ${verifyUrl}`
    });

    return res.json({ mensaje: 'Se ha reenviado el correo de verificacion. Revisa tu bandeja de entrada.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

module.exports = { login, register, verifyEmail, resendVerification };
