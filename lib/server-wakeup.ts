import { getApiBaseUrl } from "@/constants/oauth";

/**
 * 服务器状态
 */
export enum ServerStatus {
  ONLINE = "online",
  SLEEPING = "sleeping",
  WAKING = "waking",
  ERROR = "error",
}

/**
 * 检查服务器健康状态
 */
export async function checkServerHealth(): Promise<ServerStatus> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return ServerStatus.ERROR;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

    const response = await fetch(`${apiBaseUrl}/api/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return ServerStatus.ONLINE;
    } else {
      return ServerStatus.ERROR;
    }
  } catch (error) {
    // 超时或网络错误，可能是服务器休眠
    return ServerStatus.SLEEPING;
  }
}

/**
 * 唤醒服务器
 * 通过发送health check请求来唤醒休眠的服务器
 */
export async function wakeupServer(): Promise<boolean> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return false;
    }

    console.log("[Wakeup] 正在唤醒服务器...");

    // 发送唤醒请求（health check）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    const response = await fetch(`${apiBaseUrl}/api/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log("[Wakeup] 服务器已唤醒");
      return true;
    } else {
      console.log("[Wakeup] 服务器唤醒失败");
      return false;
    }
  } catch (error) {
    console.error("[Wakeup] 唤醒服务器时出错:", error);
    return false;
  }
}

/**
 * 自动检测并唤醒服务器
 * 如果服务器休眠，自动唤醒并等待
 */
export async function autoWakeupIfNeeded(): Promise<ServerStatus> {
  const status = await checkServerHealth();

  if (status === ServerStatus.SLEEPING) {
    console.log("[AutoWakeup] 检测到服务器休眠，开始唤醒");
    const success = await wakeupServer();

    if (success) {
      // 唤醒后再次检查
      const newStatus = await checkServerHealth();
      return newStatus;
    } else {
      return ServerStatus.ERROR;
    }
  }

  return status;
}
