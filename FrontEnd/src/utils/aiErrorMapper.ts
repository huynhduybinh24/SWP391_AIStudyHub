export function mapAiErrorCodeToMessage(error: any): string {
  if (!error) return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'

  const code = error?.body?.code || error?.response?.data?.code || error?.code || ''
  const message = error?.body?.message || error?.response?.data?.message || error?.message || ''

  switch (code) {
    case 'AI_UNAUTHORIZED':
      return 'Phiên đăng nhập đã hết hạn hoặc không có quyền truy cập.'
    case 'AI_DOCUMENT_REQUIRED':
      return 'Vui lòng chọn ít nhất 1 tài liệu để bắt đầu phân tích AI.'
    case 'AI_DOCUMENT_NOT_FOUND':
      return 'Không tìm thấy tài liệu được chọn trong hệ thống.'
    case 'AI_DOCUMENT_FORBIDDEN':
      return 'Bạn không có quyền truy cập tài liệu này.'
    case 'AI_DOCUMENT_NOT_READY':
      return 'Tài liệu đang trong quá trình xử lý, chưa sẵn sàng cho AI phân tích.'
    case 'AI_SESSION_FORBIDDEN':
      return 'Phiên trò chuyện không tồn tại hoặc không thuộc quyền sở hữu của bạn.'
    case 'AI_INVALID_REQUEST':
      return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại tham số.'
    case 'AI_RATE_LIMITED':
      return 'Hệ thống đang bận do nhận quá nhiều yêu cầu. Vui lòng chờ giây lát và thử lại.'
    case 'AI_MODEL_UNAVAILABLE':
      return 'Mô hình AI hiện tại không khả dụng. Vui lòng thử lại sau.'
    case 'AI_GENERATION_TIMEOUT':
      return 'Thời gian phản hồi từ AI quá lâu. Vui lòng thử lại.'
    case 'AI_RESPONSE_INVALID':
      return 'Không thể khởi tạo nội dung từ AI. Vui lòng thử lại sau.'
    case 'AI_INTERNAL_ERROR':
      return 'Lỗi nội bộ hệ thống AI. Vui lòng thử lại sau.'
    default:
      if (error?.name === 'CanceledError' || error?.message === 'canceled') {
        return 'Yêu cầu đã bị hủy.'
      }
      if (message && message !== 'Request failed' && message !== 'Network Error') {
        return message
      }
      return 'Không thể kết nối với dịch vụ AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau.'
  }
}
