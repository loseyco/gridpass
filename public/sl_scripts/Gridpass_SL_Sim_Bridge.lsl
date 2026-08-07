// Gridpass_SL_Sim_Bridge.lsl v4.7 (Robust DJ Track & Parcel Music Stream Engine)
// Universal Gridpass.app Second Life Sim & Club Management Bridge
// Auto-discovers sim region name, captures DJ "Now Playing:" broadcasts from any channel 0 bot, and streams music to web portal live!
// Explicitly checks Skinny Dip Inn Staff Group (77be7a67-1b4d-14b6-8cd3-baa441886f41) & Prim Group!
// REQUIRES MONO CHECKBOX ENABLED IN FIRESTORM (Allocates 64KB RAM)

// SETTINGS & CONFIGURATION
string GRIDPASS_BASE_URL = "https://gridpass.app"; // Live Production Endpoint
string CUSTOM_SLUG = ""; // Leave blank "" to AUTO-GENERATE slug from sim region name!
string SECRET_KEY = "gridpass_sl_bridge_secret";
string EXPLICIT_STAFF_GROUP_UUID = "77be7a67-1b4d-14b6-8cd3-baa441886f41"; // Official SDI Staff Group!

// TELEMETRY & TIMER SETTINGS
float TELEMETRY_INTERVAL = 15.0; // Pings Gridpass every 15 seconds!

// STATE VARIABLES
string gNowPlaying = "";
string gLastMusicUrl = "";
key gLastToucherKey = NULL_KEY;

string getOfficialPrimName()
{
    return llGetRegionName() + " | GridPass.app - Message";
}

string getActiveSlug()
{
    if (CUSTOM_SLUG != "") return CUSTOM_SLUG;
    
    string rName = llToLower(llGetRegionName());
    string validChars = "abcdefghijklmnopqrstuvwxyz0123456789";
    string slug = "";
    integer i;
    integer len = llStringLength(rName);
    for (i = 0; i < len; ++i)
    {
        string c = llGetSubString(rName, i, i);
        if (llSubStringIndex(validChars, c) != -1)
        {
            slug = slug + c;
        }
        else if (c == " " || c == "_" || c == "-")
        {
            if (llGetSubString(slug, -1, -1) != "-")
            {
                slug = slug + "-";
            }
        }
    }
    if (slug == "") slug = "default-sim";
    return slug;
}

buildAndSendTelemetry(string action, key toucherKey, string toucherName)
{
    string activeSlug = getActiveSlug();
    string simName = llGetRegionName();
    float fps = llGetRegionFPS();
    float td = llGetRegionTimeDilation();
    
    list agents = llGetAgentList(4, []); // 4 = AGENT_LIST_REGION
    integer agentCount = llGetListLength(agents);
    
    vector pos = llGetPos();
    list parcelDetails = llGetParcelDetails(pos, [0, 1, 2, 3, 4, 5]);
    string parcelName = llList2String(parcelDetails, 0);
    string musicUrl = llGetParcelMusicURL();
    gLastMusicUrl = musicUrl;
    
    key ownerKey = llGetOwner();
    string ownerName = llKey2Name(ownerKey);
    if (ownerName == "") ownerName = (string)ownerKey;

    list primGroupDetails = llGetObjectDetails(llGetKey(), [7]); // 7 = OBJECT_GROUP
    key primGroup = llList2Key(primGroupDetails, 0);

    list names = [];
    list visitorDataList = [];
    integer i;
    // Cap at 15 avatars per scan to keep memory footprint under 64KB Mono Limit
    for (i = 0; i < agentCount && i < 15; ++i)
    {
        key aid = llList2Key(agents, i);
        string name = llKey2Name(aid);
        if (name == "") name = (string)aid;
        names = names + [name];

        list details = llGetObjectDetails(aid, [3, 24, 7]); // 3=POS, 24=ARC, 7=GROUP
        vector vPos = llList2Vector(details, 0);
        integer arc = llList2Integer(details, 1);
        key avatarGroup = llList2Key(details, 2);

        integer isGroupMember = 0;
        if ((primGroup != NULL_KEY && avatarGroup == primGroup) || ((string)avatarGroup == EXPLICIT_STAFF_GROUP_UUID))
        {
            isGroupMember = 1;
        }

        visitorDataList = visitorDataList + [
            llList2Json(JSON_OBJECT, [
                "key", (string)aid,
                "name", name,
                "arc", (string)arc,
                "posX", (string)((integer)vPos.x),
                "posY", (string)((integer)vPos.y),
                "posZ", (string)((integer)vPos.z),
                "isGroupMember", (string)isGroupMember
            ])
        ];
    }
    string visitorList = llDumpList2String(names, ", ");
    string visitorJson = llList2Json(JSON_ARRAY, visitorDataList);

    // Free list memory immediately to prevent Stack-Heap Collision
    names = [];
    visitorDataList = [];

    vector primPos = llGetPos();
    string primPosStr = (string)((integer)primPos.x) + "," + (string)((integer)primPos.y) + "," + (string)((integer)primPos.z);

    string body = llList2Json(JSON_OBJECT, [
        "slug", activeSlug,
        "regionName", simName,
        "fps", (string)fps,
        "timeDilation", (string)td,
        "agentCount", (string)agentCount,
        "parcelName", parcelName,
        "musicUrl", musicUrl,
        "nowPlaying", gNowPlaying,
        "visitorList", visitorList,
        "visitorJson", visitorJson,
        "ownerKey", (string)ownerKey,
        "ownerName", ownerName,
        "toucherKey", (string)toucherKey,
        "toucherName", toucherName,
        "primKey", (string)llGetKey(),
        "primName", llGetObjectName(),
        "primPos", primPosStr,
        "action", action,
        "secret", SECRET_KEY
    ]);

    llHTTPRequest(GRIDPASS_BASE_URL + "/api/secondlife/telemetry", [
        HTTP_METHOD, "POST",
        HTTP_MIMETYPE, "application/json"
    ], body);
}

default
{
    state_entry()
    {
        // Enforce 64KB Mono Memory allocation, Allow Inventory Drop & Dynamic Sim Region Auto-Renaming!
        llSetMemoryLimit(65536);
        llAllowInventoryDrop(TRUE);
        
        string officialName = getOfficialPrimName();
        llSetObjectName(officialName);

        string activeSlug = getActiveSlug();
        string ncName = llGetInventoryName(INVENTORY_NOTECARD, 0);

        llOwnerSay("--------------------------------------------------");
        llOwnerSay("🏁 Gridpass SL Auto-Slug Teleport Bridge v4.7 ONLINE");
        llOwnerSay("🏷️ Prim Name Auto-Renamed To: '" + officialName + "'");
        llOwnerSay("📍 Auto-Discovered Sim Slug: " + activeSlug);
        llOwnerSay("🎧 Real-Time DJ 'Now Playing' & Parcel Audio Stream Scanner ACTIVE");
        llOwnerSay("🛡️ Staff Group Matcher Active: Group UUID '" + EXPLICIT_STAFF_GROUP_UUID + "'");
        llOwnerSay("📜 Private Instant Message Rules Delivery Engine Active");
        if (ncName != "")
            llOwnerSay("📜 Optional Prim Notecard Asset Detected: '" + ncName + "'");
        else
            llOwnerSay("ℹ️ Note: Dynamic Rules delivered cleanly via Private IM.");
        llOwnerSay("🧠 Memory Limit: 64 KB (Mono Mode Active)");
        llOwnerSay("🌐 Live Portal URL: " + GRIDPASS_BASE_URL + "/secondlife/" + activeSlug);
        llOwnerSay("--------------------------------------------------");
        
        llListen(0, "", NULL_KEY, ""); // Listen on channel 0 for DJ "Now playing:" broadcasts!
        buildAndSendTelemetry("", NULL_KEY, "");
        llSetTimerEvent(TELEMETRY_INTERVAL);
    }

    on_rez(integer start_param)
    {
        llResetScript();
    }

    timer()
    {
        string currentMusic = llGetParcelMusicURL();
        if (gLastMusicUrl != "" && currentMusic != gLastMusicUrl)
        {
            gLastMusicUrl = currentMusic;
            buildAndSendTelemetry("MUSIC_CHANGE", NULL_KEY, "");
        }
        else
        {
            gLastMusicUrl = currentMusic;
            buildAndSendTelemetry("", NULL_KEY, "");
        }
    }

    listen(integer channel, string name, key id, string message)
    {
        string lowerMsg = llToLower(message);
        integer idx = llSubStringIndex(lowerMsg, "now playing");
        if (idx == -1) idx = llSubStringIndex(lowerMsg, "playing:");
        if (idx == -1) idx = llSubStringIndex(lowerMsg, "song:");
        if (idx == -1) idx = llSubStringIndex(lowerMsg, "track:");
        
        if (idx != -1)
        {
            integer colonIdx = llSubStringIndex(message, ":");
            if (colonIdx != -1)
            {
                string track = llStringTrim(llGetSubString(message, colonIdx + 1, -1), STRING_TRIM);
                if (track != "" && track != gNowPlaying)
                {
                    gNowPlaying = track;
                    llOwnerSay("🎵 Gridpass Auto-Captured DJ Track: '" + gNowPlaying + "'");
                    buildAndSendTelemetry("NOW_PLAYING", NULL_KEY, "");
                }
            }
        }
    }

    http_response(key request_id, integer status, list metadata, string body)
    {
        if (status == 200)
        {
            string rulesVer = llJsonGetValue(body, ["rulesVersion"]);
            string rulesSummary = llJsonGetValue(body, ["rulesSummary"]);
            string deliverKeysStr = llJsonGetValue(body, ["deliverKeys"]);
            string notecardName = llGetInventoryName(INVENTORY_NOTECARD, 0);
            string portalUrl = GRIDPASS_BASE_URL + "/secondlife/" + getActiveSlug() + "?tab=rules";

            // 1. Toucher Direct Delivery (Private IM)
            if (gLastToucherKey != NULL_KEY)
            {
                string tName = llKey2Name(gLastToucherKey);
                if (tName == "") tName = "Resident";

                string toucherIm = "📜 [Gridpass Sim Rules v" + rulesVer + "] Welcome " + tName + "! Guidelines: " + rulesSummary + " 🌐 View Full Rules & Passport: " + portalUrl;
                llInstantMessage(gLastToucherKey, toucherIm);

                if (notecardName != "")
                {
                    llGiveInventory(gLastToucherKey, notecardName);
                }
                gLastToucherKey = NULL_KEY;
            }

            // 2. Passive Private Instant Message Delivery for Outdated Region Avatars (Non-Staff Visitors Only!)
            if (deliverKeysStr != "" && deliverKeysStr != JSON_INVALID)
            {
                list keyList = llParseString2List(deliverKeysStr, [","], []);
                integer len = llGetListLength(keyList);
                integer i;
                for (i = 0; i < len; ++i)
                {
                    key targetKey = (key)llList2String(keyList, i);
                    if (targetKey != NULL_KEY)
                    {
                        string targetName = llKey2Name(targetKey);
                        if (targetName == "") targetName = "Resident";
                        
                        string imMsg = "📜 [Gridpass Sim Rules v" + rulesVer + " Update] Hello " + targetName + "! Guidelines: " + rulesSummary + " 🌐 View Full Rules & Passport: " + portalUrl;
                        
                        // Send direct, private Instant Message to resident's Second Life chat!
                        llInstantMessage(targetKey, imMsg);

                        // If a Notecard exists in inventory, also hand it over
                        if (notecardName != "")
                        {
                            llGiveInventory(targetKey, notecardName);
                        }
                    }
                }
            }
        }
    }

    touch_start(integer total_number)
    {
        string activeSlug = getActiveSlug();
        key tk = llDetectedKey(0);
        string ln = llDetectedName(0);
        string dn = llKey2Name(tk);
        if (dn == "") dn = ln;

        gLastToucherKey = tk;

        string rn = llGetRegionName();
        vector ap = llDetectedPos(0);
        list pd = llGetParcelDetails(ap, [0]);
        string pn = llList2String(pd, 0);

        string authUrl = GRIDPASS_BASE_URL + "/secondlife/" + activeSlug + 
                         "?slKey=" + (string)tk + 
                         "&legacyName=" + llEscapeURL(ln) + 
                         "&displayName=" + llEscapeURL(dn) + 
                         "&region=" + llEscapeURL(rn) + 
                         "&parcel=" + llEscapeURL(pn) + 
                         "&v=" + (string)llGetUnixTime();

        // Send instant Timeclock Touch Action to Gridpass!
        buildAndSendTelemetry("timeclock_touch", tk, dn);

        llInstantMessage(tk, "⏰ Gridpass Timeclock: Welcome " + dn + "! Touch registered on Staff Board. Portal: " + authUrl);
        llLoadURL(tk, "Open Gridpass Portal & Sim Rules for " + dn, authUrl);
    }

    changed(integer change)
    {
        if (change & (CHANGED_REGION | CHANGED_REGION_START | CHANGED_TELEPORT | CHANGED_OWNER | CHANGED_INVENTORY))
        {
            llResetScript();
        }
    }
}
