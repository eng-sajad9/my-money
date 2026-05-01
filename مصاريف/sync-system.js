/**
 * نظام محسّن آمن للمزامنة
 * يوفر حفظ موثوق مع معالجة أفضل للأخطاء والبيانات المعلقة
 */

class AdvancedSyncManager {
  constructor(storagePrefix = 'expense_manager_') {
    this.storagePrefix = storagePrefix;
    this.syncStatusKey = storagePrefix + 'sync_status';
    this.syncHistoryKey = storagePrefix + 'sync_history';
    this.syncQueueKey = storagePrefix + 'sync_queue';
    this.syncRetryKey = storagePrefix + 'sync_retry_count';
    
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.batchSize = 10;
    
    this.isSyncing = false;
    this.syncTimer = null;
    this.retryTimer = null;
    
    this.listeners = [];
  }

  /**
   * حفظ البيانات بشكل آمن محلياً
   */
  saveLocal(key, data) {
    try {
      const timestamp = Date.now();
      const dataToSave = {
        data,
        savedAt: timestamp,
        version: 1,
        size: JSON.stringify(data).length
      };
      
      localStorage.setItem(key, JSON.stringify(dataToSave));
      this.logStatus('save_local_success', { key, size: dataToSave.size });
      return { success: true, timestamp, size: dataToSave.size };
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // محاولة تنظيف البيانات القديمة
        this.cleanOldData();
        try {
          localStorage.setItem(key, JSON.stringify(data));
          this.logStatus('save_local_after_cleanup', { key });
          return { success: true, timestamp: Date.now() };
        } catch (e) {
          this.logStatus('save_local_failed_quota', { error: e.message });
          return { success: false, error: 'تجاوز حد التخزين' };
        }
      }
      this.logStatus('save_local_failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * حفظ البيانات في Firebase بشكل آمن مع معالجة الأخطاء
   */
  async saveRemote(ref, data, auth = null) {
    if (!ref) {
      this.logStatus('save_remote_no_ref', {});
      return { success: false, error: 'لا يوجد مرجع Firebase' };
    }

    if (!navigator.onLine) {
      this.addToQueue({ action: 'save', data, timestamp: Date.now() });
      this.logStatus('save_remote_offline', {});
      return { success: false, error: 'بدون اتصال', queued: true };
    }

    try {
      this.isSyncing = true;
      this.notifyListeners('sync_start');
      
      // إضافة metadata للبيانات
      const dataWithMeta = {
        ...data,
        _syncedAt: Date.now(),
        _userAgent: navigator.userAgent.substring(0, 100),
        _version: '2.0'
      };

      // محاولة الحفظ البعيد
      const startTime = Date.now();
      await set(ref, dataWithMeta);
      const syncTime = Date.now() - startTime;

      // تسجيل النجاح
      this.logStatus('save_remote_success', { 
        syncTime, 
        dataSize: JSON.stringify(data).length 
      });
      this.removeFromQueue();
      this.isSyncing = false;
      this.notifyListeners('sync_success');
      
      return { success: true, syncTime, timestamp: Date.now() };
    } catch (error) {
      this.isSyncing = false;
      
      // محاولة إزالة الصور لتقليل الحجم
      if (error.message?.includes('quota') || error.message?.includes('size')) {
        this.logStatus('save_remote_size_issue', { error: error.message });
        return { success: false, error: 'البيانات كبيرة جداً', shouldCleanImages: true };
      }

      // تسجيل الخطأ وإعادة المحاولة
      const retryCount = this.getRetryCount();
      if (retryCount < this.maxRetries) {
        this.setRetryCount(retryCount + 1);
        this.addToQueue({ action: 'save', data, timestamp: Date.now() });
        this.scheduleRetry();
        this.logStatus('save_remote_retry_scheduled', { 
          retryCount, 
          error: error.message 
        });
        return { success: false, error: error.message, queued: true, willRetry: true };
      } else {
        this.logStatus('save_remote_max_retries', { error: error.message });
        return { success: false, error: 'فشلت المزامنة بعد عدة محاولات' };
      }
    }
  }

  /**
   * مزامنة البيانات المعلقة في الانتظار
   */
  async syncPending(ref, auth = null) {
    const queue = this.getQueue();
    if (queue.length === 0) return { success: true, synced: 0 };

    const results = { success: 0, failed: 0, errors: [] };
    
    try {
      this.notifyListeners('sync_pending_start', { count: queue.length });
      
      // معالجة البيانات على دفعات
      for (let i = 0; i < Math.min(this.batchSize, queue.length); i++) {
        const item = queue[i];
        try {
          await set(ref, item.data);
          results.success++;
          this.logStatus('sync_pending_item_success', { index: i });
        } catch (error) {
          results.failed++;
          results.errors.push({ index: i, error: error.message });
          this.logStatus('sync_pending_item_failed', { index: i, error: error.message });
        }
      }

      // إزالة العناصر التي تمت مزامنتها بنجاح
      if (results.success > 0) {
        this.removeFromQueue(results.success);
      }

      this.notifyListeners('sync_pending_complete', results);
      return { success: results.failed === 0, ...results };
    } catch (error) {
      this.logStatus('sync_pending_failed', { error: error.message });
      return { success: false, error: error.message, ...results };
    }
  }

  /**
   * إضافة عملية للقائمة الانتظار
   */
  addToQueue(item) {
    try {
      const queue = this.getQueue();
      queue.push({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        addedAt: Date.now()
      });
      localStorage.setItem(this.syncQueueKey, JSON.stringify(queue));
      this.logStatus('queue_add', { queueLength: queue.length });
      this.notifyListeners('queue_updated', { count: queue.length });
    } catch (error) {
      this.logStatus('queue_add_failed', { error: error.message });
    }
  }

  /**
   * إزالة عناصر من قائمة الانتظار
   */
  removeFromQueue(count = null) {
    try {
      let queue = this.getQueue();
      if (count) {
        queue = queue.slice(count);
      } else {
        queue = [];
      }
      localStorage.setItem(this.syncQueueKey, JSON.stringify(queue));
      this.logStatus('queue_remove', { remaining: queue.length });
      this.notifyListeners('queue_updated', { count: queue.length });
    } catch (error) {
      this.logStatus('queue_remove_failed', { error: error.message });
    }
  }

  /**
   * الحصول على قائمة الانتظار
   */
  getQueue() {
    try {
      const queue = localStorage.getItem(this.syncQueueKey);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      this.logStatus('queue_parse_failed', { error: error.message });
      return [];
    }
  }

  /**
   * جدولة إعادة محاولة المزامنة
   */
  scheduleRetry(delay = this.retryDelay) {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    
    this.retryTimer = setTimeout(() => {
      if (navigator.onLine) {
        this.notifyListeners('retry_attempt');
      }
    }, delay);
  }

  /**
   * الحصول على عدد محاولات إعادة المحاولة
   */
  getRetryCount() {
    try {
      return parseInt(localStorage.getItem(this.syncRetryKey) || '0');
    } catch {
      return 0;
    }
  }

  /**
   * تعيين عدد محاولات إعادة المحاولة
   */
  setRetryCount(count) {
    try {
      localStorage.setItem(this.syncRetryKey, count.toString());
    } catch (error) {
      this.logStatus('retry_count_set_failed', { error: error.message });
    }
  }

  /**
   * تسجيل سجل المزامنة
   */
  logStatus(status, details = {}) {
    try {
      const history = this.getSyncHistory();
      history.push({
        status,
        timestamp: Date.now(),
        details
      });
      
      // الاحتفاظ بآخر 100 حدث فقط
      if (history.length > 100) {
        history.shift();
      }
      
      localStorage.setItem(this.syncHistoryKey, JSON.stringify(history));
      console.log(`[Sync] ${status}:`, details);
    } catch (error) {
      console.warn('Failed to log sync status:', error);
    }
  }

  /**
   * الحصول على سجل المزامنة
   */
  getSyncHistory() {
    try {
      const history = localStorage.getItem(this.syncHistoryKey);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  /**
   * تنظيف البيانات القديمة
   */
  cleanOldData() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item && item.savedAt && Date.now() - item.savedAt > 30 * 24 * 60 * 60 * 1000) {
              localStorage.removeItem(key);
              this.logStatus('old_data_removed', { key });
            }
          } catch (e) {
            // Skip invalid items
          }
        }
      });
    } catch (error) {
      this.logStatus('cleanup_failed', { error: error.message });
    }
  }

  /**
   * الاشتراك في أحداث المزامنة
   */
  onSyncEvent(callback) {
    this.listeners.push(callback);
  }

  /**
   * إبلاغ المستمعين بأحداث المزامنة
   */
  notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback({ event, data, timestamp: Date.now() });
      } catch (error) {
        console.warn('Listener error:', error);
      }
    });
  }

  /**
   * الحصول على حالة المزامنة الشاملة
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.getQueue().length,
      retryCount: this.getRetryCount(),
      lastHistory: this.getSyncHistory().slice(-5)
    };
  }
}

// تصدير الفئة للاستخدام
window.AdvancedSyncManager = AdvancedSyncManager;
