// src/eventBus.js
import mitt from 'mitt';

// Export một instance của emitter để dùng trong toàn bộ ứng dụng
export const emitter = mitt();