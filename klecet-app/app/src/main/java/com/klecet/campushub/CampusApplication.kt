package com.klecet.campushub

import android.app.Application
import com.klecet.campushub.network.ApiClient
import com.klecet.campushub.network.AuthManager

class CampusApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        AuthManager.init(this)
        ApiClient.init(this)
    }

    companion object {
        lateinit var instance: CampusApplication
            private set
    }
}
