package com.klecet.campushub.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.klecet.campushub.model.Notification
import com.klecet.campushub.network.NetworkResult
import com.klecet.campushub.repository.CampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NotificationViewModel(
    private val repository: CampusRepository = CampusRepository()
) : ViewModel() {

    private val _notifications = MutableStateFlow<List<Notification>>(emptyList())
    val notifications: StateFlow<List<Notification>> = _notifications.asStateFlow()

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadNotifications()
    }

    fun loadNotifications() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val res = repository.getNotifications()) {
                is NetworkResult.Success -> {
                    _notifications.value = res.data.first
                    _unreadCount.value = res.data.second
                }
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun markAsRead(id: String) {
        viewModelScope.launch {
            when (repository.markNotificationRead(id)) {
                is NetworkResult.Success -> {
                    _notifications.value = _notifications.value.map {
                        if (it.id == id) it.copy(read = true) else it
                    }
                    _unreadCount.value = (_unreadCount.value - 1).coerceAtLeast(0)
                }
                else -> {}
            }
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            when (repository.markAllNotificationsRead()) {
                is NetworkResult.Success -> {
                    _notifications.value = _notifications.value.map { it.copy(read = true) }
                    _unreadCount.value = 0
                }
                else -> {}
            }
        }
    }
}
