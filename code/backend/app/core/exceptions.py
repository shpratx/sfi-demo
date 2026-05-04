"""Application exception hierarchy."""


class AppException(Exception):
    def __init__(
        self,
        status_code: int = 500,
        error_type: str = "INTERNAL_ERROR",
        title: str = "Internal Server Error",
        detail: str = "",
    ) -> None:
        self.status_code = status_code
        self.error_type = error_type
        self.title = title
        self.detail = detail
        super().__init__(detail)


class NotFoundError(AppException):
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(404, "NOT_FOUND", "Not Found", detail)


class ConflictError(AppException):
    def __init__(self, detail: str = "Resource conflict") -> None:
        super().__init__(409, "CONFLICT", "Conflict", detail)


class BusinessRuleError(AppException):
    def __init__(self, detail: str = "Business rule violation") -> None:
        super().__init__(422, "BUSINESS_RULE_ERROR", "Unprocessable Entity", detail)


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Forbidden") -> None:
        super().__init__(403, "FORBIDDEN", "Forbidden", detail)


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Unauthorized") -> None:
        super().__init__(401, "UNAUTHORIZED", "Unauthorized", detail)
