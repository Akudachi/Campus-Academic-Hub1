package com.klecet.campushub.network

import com.google.gson.Gson
import com.klecet.campushub.model.ExtractedTimetableRow
import com.klecet.campushub.model.Teacher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Gemini Timetable AI Extraction Service.
 *
 * ARCHITECTURE & SECURITY NOTICE:
 * In production Android applications, Gemini API keys MUST NOT be stored in client-side code.
 * The primary implementation routes through the secure backend endpoint [ApiService.uploadTimetable]
 * which keeps API secrets hidden on the server.
 *
 * A direct Gemini REST endpoint is also implemented here for offline/direct debugging, with keys
 * read exclusively from secure local storage or BuildConfig.
 */
object GeminiService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    /**
     * Extracts timetable data via the backend endpoint (Recommended & Secure)
     */
    suspend fun extractViaBackend(
        fileName: String?,
        rawText: String?,
        fileContent: String?,
        imageData: String?,
        imageMimeType: String?,
        semester: Int,
        departmentCode: String
    ): Result<List<ExtractedTimetableRow>> = withContext(Dispatchers.IO) {
        try {
            val payload = mutableMapOf<String, Any>(
                "semester" to semester,
                "departmentCode" to departmentCode
            )
            fileName?.let { payload["fileName"] = it }
            rawText?.let { payload["rawText"] = it }
            fileContent?.let { payload["fileContent"] = it }
            imageData?.let { payload["imageData"] = it }
            imageMimeType?.let { payload["imageMimeType"] = it }

            val response = ApiClient.apiService.uploadTimetable(payload)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                val extractedList = mutableListOf<ExtractedTimetableRow>()
                val rowsRaw = body["extractedRows"]
                if (rowsRaw is List<*>) {
                    for (item in rowsRaw) {
                        val json = gson.toJson(item)
                        val row = gson.fromJson(json, ExtractedTimetableRow::class.java)
                        extractedList.add(row)
                    }
                }
                Result.success(extractedList)
            } else {
                Result.failure(Exception("Backend error: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Fallback direct client-side extraction using Gemini REST API
     * (Requires GEMINI_API_KEY)
     */
    suspend fun extractDirectly(
        apiKey: String,
        promptText: String,
        base64Image: String? = null,
        mimeType: String = "image/jpeg"
    ): Result<String> = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) {
            return@withContext Result.failure(IllegalArgumentException("Gemini API key is missing"))
        }

        try {
            val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey"

            val partsArray = JSONArray()

            // If image is attached
            if (!base64Image.isNullOrBlank()) {
                val inlineData = JSONObject().apply {
                    put("mimeType", mimeType)
                    put("data", base64Image.replace("\n", "").replace("\r", ""))
                }
                partsArray.put(JSONObject().put("inlineData", inlineData))
            }

            // Text prompt
            partsArray.put(JSONObject().put("text", promptText))

            val contentObj = JSONObject().apply {
                put("parts", partsArray)
            }

            val requestBody = JSONObject().apply {
                put("contents", JSONArray().put(contentObj))
            }.toString().toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url(url)
                .post(requestBody)
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""

            if (response.isSuccessful) {
                Result.success(responseBody)
            } else {
                Result.failure(Exception("Gemini API Error ${response.code}: $responseBody"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
