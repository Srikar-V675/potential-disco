import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionId = localStorage.getItem('sessionId');

  if (sessionId) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${sessionId}` }
    });
  }

  return next(req);
};
