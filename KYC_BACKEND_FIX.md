# KYC Backend Fix

## Root cause

The live backend runs from:

`C:\Users\Administrator\IdeaProjects\nexa-bank-backend`

Its KYC controller accepts document submissions as multipart uploads:

`POST /api/v1/kyc/documents`

Required request part:

`file`

Accepted content types:

- `application/pdf`
- `image/jpeg`
- `image/png`

Maximum configured request size:

`10 MB`

The frontend previously sent JSON to `POST /api/v1/kyc`. That path only has a
GET mapping, so Spring raises `HttpRequestMethodNotSupportedException`.
`GlobalExceptionHandler.handleGeneral` catches that framework exception and
incorrectly returns:

```json
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "status": 500
}
```

The frontend has been corrected to send a CSRF-protected multipart request to
`POST /api/v1/kyc/documents`.

## Required backend hardening

Add explicit handlers before the general `Exception` handler in
`GlobalExceptionHandler.java`:

```java
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
public ResponseEntity<ApiError> handleMethodNotAllowed(
        HttpRequestMethodNotSupportedException exception,
        HttpServletRequest request
) {
    return response(
            HttpStatus.METHOD_NOT_ALLOWED,
            "METHOD_NOT_ALLOWED",
            "This HTTP method is not supported for the requested endpoint",
            Map.of(),
            request
    );
}

@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
public ResponseEntity<ApiError> handleUnsupportedMediaType(
        HttpMediaTypeNotSupportedException exception,
        HttpServletRequest request
) {
    return response(
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            "UNSUPPORTED_MEDIA_TYPE",
            "KYC documents must be submitted as multipart/form-data",
            Map.of(),
            request
    );
}

@ExceptionHandler(MissingServletRequestPartException.class)
public ResponseEntity<ApiError> handleMissingRequestPart(
        MissingServletRequestPartException exception,
        HttpServletRequest request
) {
    return response(
            HttpStatus.BAD_REQUEST,
            "MISSING_REQUEST_PART",
            "The KYC document file is required",
            Map.of(),
            request
    );
}
```

## Optional compatibility alias

To support multipart submissions at both the collection root and the explicit
documents path, change the primary upload mapping in `KycController.java`:

```java
import org.springframework.http.MediaType;

@PostMapping(
        value = {"", "/documents"},
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public ResponseEntity<KycDocumentResponse> upload(
        @RequestPart("file") MultipartFile file,
        Authentication authentication
) throws IOException {
    KycDocument document = kycService.upload(file, principal(authentication));
    return ResponseEntity.ok(bankMapper.toKycDocumentResponse(document));
}
```

Keep `/upload` only as the legacy alias.

## Regression tests

Add MVC tests covering:

1. Authenticated multipart upload with a valid CSRF token returns `200`.
2. Missing `file` part returns `400` with `MISSING_REQUEST_PART`.
3. Without the compatibility alias, POST to `/api/v1/kyc` returns `405`, not `500`.
4. With the multipart compatibility alias, JSON POST to `/api/v1/kyc` returns `415`, not `500`.
5. PDF, JPEG, and PNG files are accepted.
6. Empty, oversized, and unsupported files return their documented 4xx errors.

After applying backend changes, recompile and restart the IntelliJ Spring Boot
process so `target/classes` contains the updated controller and exception
handler.
