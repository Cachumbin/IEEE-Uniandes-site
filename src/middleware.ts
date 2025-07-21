import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

export const onRequest = defineMiddleware(async (context, next) => {
    if (context.url.pathname.startsWith("/admin")) {
        const accessToken = context.cookies.get("sb-access-token")?.value;
        const refreshToken = context.cookies.get("sb-refresh-token")?.value;

        if (!accessToken || !refreshToken) {
            return context.redirect("/login");
        }

        const { data, error } = await supabase.auth.setSession({
            refresh_token: refreshToken,
            access_token: accessToken,
        });

        if (error || !data.session) {
            context.cookies.delete("sb-access-token", { path: "/" });
            context.cookies.delete("sb-refresh-token", { path: "/" });
            return context.redirect("/login");
        }
    }
    return next();
});
