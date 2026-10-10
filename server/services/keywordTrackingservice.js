import { rankTracker } from "./rankTrackerService.js";

export async function keywordTracking(tracking) {
    try {
        let result;

        // Try up to 2 times for reliability
        for (let attempt = 1; attempt <= 2; attempt++) {
            result = await rankTracker(tracking.keyword, tracking.domain);
            if (result.success && result.totalResultScanned > 0) break; // Fixed 'totale' typo
            if (attempt < 2) await new Promise((r) => setTimeout(r, result.success ? 3000 : 5000));
        }

        if (result.success) {
            const prev = tracking.currentPosition;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            tracking.currentPosition = result.data.position;
            tracking.currentPage = result.data.page;
            tracking.competitors = result.data.competitors; // Fixed 'competitor' to 'competitors'
            tracking.status = "completed"; // Fixed 'lastChecked' to 'status' as per your schema

            // Update stats
            tracking.positionChange = (prev && result.data.position) ? prev - result.data.position : 0;
            if (result.data.position && (!tracking.bestPosition || result.data.position < tracking.bestPosition)) {
                tracking.bestPosition = result.data.position;
            }

            // Update history
            const historyEntry = {
                date: today,
                position: result.data.position,
                snippet: result.data.snippet,
            };
            
            const idx = tracking.rankHistory.findIndex((h) => h.date.toDateString() === today.toDateString());
            if (idx >= 0) tracking.rankHistory[idx] = historyEntry;
            else tracking.rankHistory.push(historyEntry);

        } else {
            tracking.status = "failed";
        }
        
        await tracking.save();
        return result;

    } catch (err) {
        console.error("Rank update error:", err.message);
        tracking.status = "failed";
        await tracking.save().catch(() => {});
        return { success: false, error: err.message };
    }
}