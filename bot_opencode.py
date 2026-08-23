import os
import subprocess
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder, 
    CommandHandler, 
    MessageHandler, 
    CallbackQueryHandler, 
    filters, 
    ContextTypes
)

# -------------------------------------------------------------
# CONFIGURACIÓN GENERAL (CON TUS DATOS INTEGRADOS)
# -------------------------------------------------------------
TELEGRAM_TOKEN = "8933967200:AAGuOHiBuw6QjqpDQsGJ_kl_hGzax-PiL_E"
ALLOWED_USER_ID = 7506092177

# Cambia esta ruta por la carpeta donde tengas los archivos de tu CRM
# IMPORTANTE: En Windows usa barras normales "/" (ej: "C:/Proyectos/CRM")
PROJECT_DIR = "C:/Users/Poyet/Documents/tbv-cmr"

# MODELO POR DEFECTO Y LISTA DE DISPONIBLES
current_model = "google/gemini-2.5-flash"

AVAILABLE_MODELS = {
    "Gemini 2.5 Flash (Gratis)": "google/gemini-2.5-flash",
    "Qwen 2.5 Coder 3B (Local)": "ollama/qwen2.5-coder:3b",
    "Llama 3.2 3B (Local)": "ollama/llama3.2:3b",
    "Claude 3.5 Sonnet": "anthropic/claude-3-5-sonnet",
}

# -------------------------------------------------------------
# GESTIÓN DE SELECCIÓN DE MODELO CON MENÚ INTERACTIVO
# -------------------------------------------------------------
async def cmd_modelo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ALLOWED_USER_ID:
        return

    keyboard = [
        [InlineKeyboardButton(name, callback_data=f"set_model:{model_id}")]
        for name, model_id in AVAILABLE_MODELS.items()
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"⚙️ **Modelo actual:** `{current_model}`\n\nSelecciona el modelo que deseas usar:",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global current_model
    query = update.callback_query
    await query.answer()

    if query.data.startswith("set_model:"):
        current_model = query.data.split("set_model:")[1]
        await query.edit_message_text(
            f"✅ **Modelo actualizado con éxito.**\nAhora OpenCode usará: `{current_model}`",
            parse_mode="Markdown"
        )

# -------------------------------------------------------------
# EJECUTOR DE OPENCODE EN SEGUNDO PLANO
# -------------------------------------------------------------
def run_opencode(prompt: str, image_path: str = None) -> str:
    cmd = ["opencode", "--prompt", prompt, "--model", current_model]
    
    if image_path:
        cmd.extend(["--file", image_path])

    result = subprocess.run(
        cmd,
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=180
    )
    return result.stdout if result.stdout else result.stderr

# -------------------------------------------------------------
# GESTOR DE MENSAJES (TEXTO Y FOTOS)
# -------------------------------------------------------------
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Seguridad estricta: solo te responderá a ti
    if update.effective_user.id != ALLOWED_USER_ID:
        await update.message.reply_text("Acceso no autorizado.")
        return

    user_prompt = update.message.text or update.message.caption or "Analiza esta imagen."
    image_path = None

    # Si envías una foto desde Telegram
    if update.message.photo:
        await update.message.reply_text("🖼️ Descargando imagen...")
        photo_file = await update.message.photo[-1].get_file()
        image_path = os.path.join(PROJECT_DIR, "temp_telegram_input.jpg")
        await photo_file.download_to_drive(image_path)

    await update.message.reply_text(f"⏳ Procesando con `{current_model}`...", parse_mode="Markdown")

    try:
        response = run_opencode(user_prompt, image_path)
        
        # Elimina la foto temporal creada en la carpeta
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

        # Si el texto de respuesta es muy largo, lo envía por partes
        if len(response) > 4000:
            for i in range(0, len(response), 4000):
                await update.message.reply_text(response[i:i+4000])
        else:
            await update.message.reply_text(response or "Tarea completada.")

    except subprocess.TimeoutExpired:
        await update.message.reply_text("⚠️ Tiempo de espera agotado (OpenCode tardó demasiado).")
    except Exception as e:
        await update.message.reply_text(f"❌ Error al ejecutar OpenCode: {str(e)}")

# -------------------------------------------------------------
# INICIALIZACIÓN Y ARRANQUE DEL BOT
# -------------------------------------------------------------
if __name__ == "__main__":
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    
    # Manejadores de comandos y mensajes
    app.add_handler(CommandHandler("modelo", cmd_modelo))
    app.add_handler(CallbackQueryHandler(button_callback))
    app.add_handler(MessageHandler((filters.TEXT | filters.PHOTO) & ~filters.COMMAND, handle_message))
    
    print("Bot encendido y listo.")
    app.run_polling()