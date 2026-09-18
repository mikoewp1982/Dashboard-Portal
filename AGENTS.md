# MANDATORY AGENT BEHAVIOR & REGRESSION PREVENTION RULES
> Target: All AI Agents, Coding Assistants, and Automated Tools working on `Dashboard Portal`.

## 🚨 RULE 1: STRICT SCOPE ISOLATION (ZERO TOUCH ON UNRELATED FILES)
- When executing a task, you MUST ONLY edit files explicitly requested or strictly required to solve that specific task.
- NEVER "refactor", "cleanup", or "align" unrelated logic in files that were not asked for by the user.
- Before committing or finishing any turn, run `git diff --stat`. If you touched ANY file outside your target scope, you MUST REVERT IT immediately (`git checkout -- <file>`).

## 🔒 RULE 2: NEVER TAMPER WITH FROZEN CORE LOGIC
Read `FITUR_STABIL_JANGAN_DISENTUH.md` before making changes. The following areas are strictly FROZEN:

1. **Virtual Pet Death & Revive Logic (`web/src/lib/guru/petStatus.ts`, `GasPetRiskTab.tsx`)**:
   - `isDeadByRule` MUST return `isMarkedDead || health <= 0 || lowest <= 0`.
   - NEVER use `isMarkedDead && (...)`. Depleted vitals (`lowestVital <= 0`) MUST ALWAYS be treated as Dead / Requiring Revive on Web Admin because it locks the mobile app!
   - The "Hidupkan" (Revive) button in `GasPetRiskTab.tsx` MUST ALWAYS be visible for both `Mati` and `Sekarat` pets.

2. **Master Switch FCM TTL & WakeLock (`web/src/lib/admin/edulockMasterSwitch.ts`, `EduLockMessagingService.kt`)**:
   - Master Switch FCM TTL must NEVER be less than 86,400s (24h).
   - Find Device FCM TTL must NEVER be less than 300s (5m).

3. **Android 13+ Accessibility Bypass (3 Dots / Restricted Settings)**:
   - Must preserve the 2-step prompt in `SetupActivity.kt`, `OverlayLockActivity.kt`, and `MainActivity.kt` ("Langkah 1: Info Aplikasi" -> "Langkah 2: Aksesibilitas").

4. **GAS Guru vs Student UI Separation**:
   - Student = 4-column compact cards + 3-tab bottom nav.
   - Teacher = 2-column large glassmorphism cards. NO BOTTOM NAV ALLOWED.

## 🛠️ RULE 3: PRE-BUILD & PRE-COMMIT VALIDATION
- Always run `node ./scripts/verify-critical-rules.mjs` inside `web/` before proposing any web changes.
- If the verification fails, do NOT bypass it. Fix the code to adhere to the critical rules.
