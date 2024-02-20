const logger = {}

logger.emergency = function (...data) {
  if (getLogLevel() >= 1) console.log("[EMERGENCY] ", data)
}
logger.alert = function alert (...data) {
  if (getLogLevel() >= 2) console.log("[ALERT]     ", data)
}
logger.critical = function critical (...data) {
  if (getLogLevel() >= 3) console.log("[CRITICAL]  ", data)
}
logger.error = function error (...data) {
  if (getLogLevel() >= 4) console.log("[ERROR]     ", data)
}
logger.warning = function warning (...data) {
  if (getLogLevel() >= 5) console.log("[WARNING]   ", data)
}
logger.notice = function notice (...data) {
  if (getLogLevel() >= 6) console.log("[NOTICE]    ", data)
}
logger.info = function info (...data) {
  if (getLogLevel() >= 7) console.log("[INFO]      ", data)
}
logger.debug = function debug (...data) {
  if (getLogLevel() >= 8) console.log("[DEBUG]     ", data)
}

function getLogLevel () {
  const level = process.env.LOG_LEVEL

  if (level === 'EMERGENCY') return 1  // Emergency is unusable (Unfixable)
  if (level === 'ALERT') return 2  // Alert is unsecure
  if (level === 'CRITICAL') return 3  // Critical is stateful
  if (level === 'ERROR') return 4  // Error is unstable
  if (level === 'WARNING') return 5  // Warning is undesired
  if (level === 'NOTICE') return 6  // Notice is relevant
  if (level === 'INFO') return 7  // Informational is statistical
  if (level === 'DEBUG') return 8  // Debug is development
}

export default logger

