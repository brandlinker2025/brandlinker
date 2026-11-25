import { createHash, timingSafeEqual } from "node:crypto";
export function verifyAdminToken(provided: string | null, configured: string | undefined): boolean {
 if (!configured || configured.length < 32 || !provided || provided.length > 4096) return false;
 const digest=(value:string)=>createHash("sha256").update(value,"utf8").digest();
 return timingSafeEqual(digest(provided),digest(configured));
}
export function authorizeBearer(header: string | null, configured: string | undefined): boolean {
 if (!header?.startsWith("Bearer ")) return false;
 return verifyAdminToken(header.slice(7),configured);
}
