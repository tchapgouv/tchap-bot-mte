const getLogLevel = function () {
    const level = process.env.LOG_LEVEL

    if (level === 'EMERGENCY') return 1  // Emergency is unusable (Unfixable)
    if (level === 'ALERT') return 2  // Alert is unsecure
    if (level === 'CRITICAL') return 3  // Critical is stateful
    if (level === 'ERROR') return 4  // Error is unstable
    if (level === 'WARNING') return 5  // Warning is undesired
    if (level === 'NOTICE') return 6  // Notice is relevant
    if (level === 'INFO') return 7  // Informational is statistical
    if (level === 'DEBUG') return 8  // Debug is development
    return 5
}

class Logger {

    emergency = function (...data: any[]) {
        if (getLogLevel() >= 1) console.log("[EMERGENCY] ", data)
    }
    alert = function alert(...data: any[]) {
        if (getLogLevel() >= 2) console.log("[ALERT]     ", data)
    }
    critical = function critical(...data: any[]) {
        if (getLogLevel() >= 3) console.log("[CRITICAL]  ", data)
    }
    error = function error(...data: any[]) {
        if (getLogLevel() >= 4) console.log("[ERROR]     ", data)
    }
    warning = function warning(...data: any[]) {
        if (getLogLevel() >= 5) console.log("[WARNING]   ", data)
    }
    notice = function notice(...data: any[]) {
        if (getLogLevel() >= 6) console.log("[NOTICE]    ", data)
    }
    info = function info(...data: any[]) {
        if (getLogLevel() >= 7) console.log("[INFO]      ", data)
    }
    debug = function debug(...data: any[]) {
        if (getLogLevel() >= 8) console.log("[DEBUG]     ", data)
    }
}

const logger = new Logger()

export default logger

