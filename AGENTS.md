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

2. **EduLock at Home: Fail-Open Policy (`GpsEnableOverlay.kt`, `MonitoringService.kt`)**:
   - At home (>1km from school), devices MUST NOT be locked.
   - GPS-off at home MUST NEVER trigger "Aktifkan GPS" recovery overlay or kiosk lock.
   - Sticky `isInsideSchoolZone` MUST auto-reset after 30 minutes outside school.

3. **Overlay Pet Dead at Home: Understood Button & Reminders (`PetDeadLockActivity.kt`)**:
   - ONLY active outside school hours / at home.
   - The "Saya Mengerti" button MUST dismiss the overlay temporarily with a 2-second debounce, allowing the student to use their phone until the next reminder interval.
   - Hardware HOME button MUST reset `isShowing` (`onUserLeaveHint`) so future reminders appear.
   - Auto-dismiss immediately when revived in Web Admin.

4. **EduLock to GAS Transition: Anti-Kickback & 0 Frame Home (`MainActivity.kt`, `AllowedPackagesProvider.kt`)**:
   - MUST NOT show launcher home frame or keyguard PIN.
   - MUST NOT kick the user back to EduLock (unpin kiosk via lifecycle `onStop`).
   - OEM helper apps (keyboards, system UI, navigation gestures) MUST remain whitelisted.

5. **Anti-Uninstall 24/7/365 (`AntiUninstallService.kt`)**:
   - MUST run 24/7 independently of school hours or geofence.
   - Immediately kick out any attempt to access EduLock device admin, app details, or uninstall dialogs.

6. **Master Switch FCM TTL & WakeLock (`web/src/lib/admin/edulockMasterSwitch.ts`, `EduLockMessagingService.kt`)**:
   - Master Switch FCM TTL must NEVER be less than 86,400s (24h).
   - Find Device FCM TTL must NEVER be less than 300s (5m).

7. **Android 13+ Accessibility Bypass (3 Dots / Restricted Settings)**:
   - Must preserve the 2-step prompt in `SetupActivity.kt`, `OverlayLockActivity.kt`, and `MainActivity.kt` ("Langkah 1: Info Aplikasi" -> "Langkah 2: Aksesibilitas").

8. **GAS Guru vs Student UI Separation**:
   - Student = 4-column compact cards + 3-tab bottom nav.
   - Teacher = 2-column large glassmorphism cards. NO BOTTOM NAV ALLOWED.

9. **Schedule Sync SSOT & Saturday Holiday Integrity (`PreferencesManager.kt`, `MonitoringService.kt`, `MainActivity.kt`, `SchoolScheduleManager.kt`)**:
   - Modern path `school_settings/{id}/attendance/schedules` is the SSOT, tagged `SOURCE_ATTENDANCE_SCHEDULES`.
   - Legacy path `schools/{id}/schedule/weekdays` and `MainActivity` rogue writer MUST NEVER overwrite SSOT data. Flawed key-count heuristic (`root.length() >= existing.length()`) is strictly prohibited.
   - Internal fallback for Saturday & Sunday MUST default to `enabled = false` (holiday).
   - All JUnit test cases in `SchoolScheduleManagerTest.kt` MUST pass 100% before building APK.

## 🛠️ RULE 3: PRE-BUILD & PRE-COMMIT VALIDATION
- Always run `node ./scripts/verify-critical-rules.mjs` inside `web/` before proposing any web changes.
- If the verification fails, do NOT bypass it. Fix the code to adhere to the critical rules.
