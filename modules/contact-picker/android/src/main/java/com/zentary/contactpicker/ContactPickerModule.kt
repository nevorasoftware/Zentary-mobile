package com.zentary.contactpicker

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.provider.ContactsContract.CommonDataKinds.Phone
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val PICK_CONTACT_REQUEST_CODE = 5395

// Selector de contactos del sistema: Android concede acceso temporal solo a la fila elegida,
// por lo que la app no declara READ_CONTACTS ni puede leer el resto de la agenda.
class ContactPickerModule : Module() {
  private var pendingPick: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("ContactPicker")

    AsyncFunction("pickPhoneContactAsync") { promise: Promise ->
      if (pendingPick != null) {
        promise.reject("ERR_PICK_IN_PROGRESS", "Ya hay un selector de contactos abierto", null)
        return@AsyncFunction
      }
      val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
      pendingPick = promise
      try {
        activity.startActivityForResult(Intent(Intent.ACTION_PICK, Phone.CONTENT_URI), PICK_CONTACT_REQUEST_CODE)
      } catch (e: ActivityNotFoundException) {
        pendingPick = null
        promise.reject("ERR_NO_CONTACT_PICKER", "El dispositivo no tiene un selector de contactos", e)
      }
    }

    OnActivityResult { _, (requestCode, resultCode, data) ->
      if (requestCode != PICK_CONTACT_REQUEST_CODE) return@OnActivityResult
      val promise = pendingPick ?: return@OnActivityResult
      pendingPick = null
      val uri = data?.data
      if (resultCode != Activity.RESULT_OK || uri == null) {
        promise.resolve(null)
        return@OnActivityResult
      }
      try {
        promise.resolve(readContact(uri))
      } catch (e: Exception) {
        promise.reject("ERR_READ_CONTACT", "No se pudo leer el contacto elegido", e)
      }
    }
  }

  private fun readContact(uri: Uri): Map<String, String>? {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    val projection = arrayOf(Phone.DISPLAY_NAME, Phone.NUMBER)
    context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        return mapOf(
          "name" to (cursor.getString(0) ?: ""),
          "phone" to (cursor.getString(1) ?: "")
        )
      }
    }
    return null
  }
}
