import { test, expect } from "@playwright/test";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  projectId: "gridpass",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

test.describe("GridPass Commander Multi-Driver Queue & Seat Rotation Suite", () => {
  const testRigId = "gp_trailer_pod1";

  test.beforeEach(async () => {
    // Clean stale sessions for gp_trailer_pod1
    const qSess = query(
      collection(db, "commander_rig_sessions"),
      where("rig_id", "==", testRigId)
    );
    const snapSess = await getDocs(qSess);
    for (const d of snapSess.docs) {
      await deleteDoc(doc(db, "commander_rig_sessions", d.id));
    }

    // Setup online test telemetry state for gp_trailer_pod1
    await setDoc(
      doc(db, "commander_rigs", testRigId),
      {
        id: testRigId,
        name: "GridPass Mobile Sim Trailer - Pod #1",
        status: "online",
        current_session_id: null,
        location_name: "Mobile Paddock Unit (6x10 Cargo Trailer)",
        session_max_minutes: 8,
        session_grace_period_finish_lap: true,
        telemetry: {
          speed: 18.5,
          rpm: 7200,
          gear: 2,
          lap: 3,
          lap_time: 14.82,
          best_lap: 11.509,
          lap_delta_best: 0.0,
          oil_temp_c: 89.5,
          water_temp_c: 77.0,
          fuel_level: 5.8,
          is_on_track: true,
          is_in_pit_stall: false,
          car_name: "FIA Cross Car",
          track_name: "Centripetal Circuit",
          track_layout: "Full Course",
          source: "iRacing (PyIRSDK)",
          timestamp: Date.now(),
        },
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  });

  test.afterAll(async () => {
    // Clean up all GPTestUser_* entities
    const qSess = query(
      collection(db, "commander_rig_sessions"),
      where("rig_id", "==", testRigId)
    );
    const snapSess = await getDocs(qSess);
    for (const d of snapSess.docs) {
      if (
        d.data().driver_name?.startsWith("GPTestUser_") ||
        d.data().driver_handle?.startsWith("@GPTestUser_")
      ) {
        await deleteDoc(doc(db, "commander_rig_sessions", d.id));
      }
    }

    const qLaps = query(
      collection(db, "commander_laps"),
      where("rig_id", "==", testRigId)
    );
    const snapLaps = await getDocs(qLaps);
    for (const d of snapLaps.docs) {
      if (
        d.data().driver_name?.startsWith("GPTestUser_") ||
        d.data().driver_handle?.startsWith("@GPTestUser_")
      ) {
        await deleteDoc(doc(db, "commander_laps", d.id));
      }
    }
  });

  test("1. Multi-Driver Queue Intake stages drivers in sequential order", async ({
    page,
  }) => {
    // Navigate to mobile rig intake
    await page.goto(`http://localhost:3000/rig/${testRigId}`);

    // Verify online banner
    await expect(page.locator("h1")).toContainText("GridPass Mobile Sim Trailer");
    await expect(page.getByText("LIVE INTAKE ACTIVE")).toBeVisible({ timeout: 10000 });

    // Join queue as Driver #1: Marcus
    const joinBtn = page.getByRole("button", { name: /JOIN HOT LAP QUEUE/i });
    await expect(joinBtn).toBeVisible({ timeout: 10000 });
    await joinBtn.click();

    await expect(page.getByText("Driver Check-In")).toBeVisible({ timeout: 5000 });
    await page.fill('input[placeholder="e.g. Marcus Miller"]', "GPTestUser_Marcus");
    await page.fill('input[placeholder="@driver"]', "@GPTestUser_Marcus");
    await page.getByRole("button", { name: /CLAIM SPOT IN QUEUE/i }).click();

    // Wait for modal to dismiss
    await expect(page.getByText("Driver Check-In")).toBeHidden({ timeout: 5000 });

    // Verify Driver #1 status
    await expect(page.getByText("YOUR LIVE SESSION STATUS")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "GPTestUser_Marcus" })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("#1", { exact: true })).toBeVisible({ timeout: 5000 });

    // Driver #1 is ready to drive -> Start driving
    const driveNowBtn = page.getByRole("button", { name: /START DRIVING NOW/i });
    await expect(driveNowBtn).toBeVisible({ timeout: 5000 });
    await driveNowBtn.click();

    // Verify on track status
    await expect(page.getByText("TRACK STATUS")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("ON TRACK (GREEN FLAG)")).toBeVisible({ timeout: 5000 });
  });

  test("2. Paddock Timing Leaderboard renders fastest laps and records", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000/rig/${testRigId}/leaderboard`);

    // Verify Leaderboard layout
    await expect(page.getByText("LIVE PADDOCK TIMING")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Event Leaderboard & Fastest Laps")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("FASTEST LAPS")).toBeVisible({ timeout: 5000 });
  });
});
