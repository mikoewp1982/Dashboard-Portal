import { adminDb } from '../src/lib/firebase-admin';

async function run() {
    try {
        console.log("Updating Firebase download_url_gas...");
        await adminDb.ref("app_settings/android").update({
            download_url_gas: "https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/gas/install"
        });
        console.log("Update successful!");
        process.exit(0);
    } catch (e) {
        console.error("Failed to update Firebase:", e);
        process.exit(1);
    }
}

run();
