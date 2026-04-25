import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. 精准定义“受保护的区域” (也就是必须要登录才能进的地方)
const isProtectedRoute = createRouteMatcher([
  "/call-assistant(.*)", // 保护所有的 call-assistant 页面
  "/history(.*)"        // 顺便把你之前写的 history 也保护起来
]);

// 2. 拦截逻辑
export default clerkMiddleware(async (auth, req) => {
  // 如果用户访问的是上面定义的受保护区域，就强制要求他们登录
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  // 其他所有没有在这里列出的路径（比如 "/" 和 "/badminton"），Clerk 会自动放行！
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};