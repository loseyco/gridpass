import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * Calculates the voting weight for a given user.
 * - Guest (anonymous/no UID): 1 vote
 * - Logged-in Member: 5 votes
 * - Verified Vehicle Owner (has at least 1 registered vehicle): 10 votes
 */
export async function getVoteWeight(voterUid: string | null | undefined, db: any): Promise<number> {
  if (!voterUid) return 1;

  // Mock voters for local/E2E environment
  const mockUids = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'playwright-mock-uid'];
  if (mockUids.includes(voterUid)) {
    // Let's say playwright and certain mock profiles are verified vehicle owners (weight 10), others are members (weight 5)
    return voterUid === 'm1' || voterUid === 'playwright-mock-uid' ? 10 : 5;
  }

  try {
    // 1. Check if user has any registered vehicles in 'vehicles' collection
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('owner_id', '==', voterUid));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return 10; // Verified Vehicle Owner
    }

    // 2. Fallback to standard logged-in member
    return 5;
  } catch (err) {
    console.error("Error calculating voter weight, defaulting to guest:", err);
    return 1;
  }
}

/**
 * Submits a weighted vote for a vehicle in a virtual car show.
 * Prevents double voting on a per-category basis.
 */
export async function submitVote(
  showId: string,
  vehicleId: string,
  category: string,
  voterUid: string | null | undefined,
  voterIpHash: string,
  db: any
): Promise<{ success: boolean; message: string; weight: number }> {
  
  // 1. Double vote protection check
  const votesRef = collection(db, 'show_votes');
  let q;

  if (voterUid) {
    // Check if user has already voted in this category for this show
    q = query(
      votesRef,
      where('show_id', '==', showId),
      where('category', '==', category),
      where('voter_uid', '==', voterUid)
    );
  } else {
    // Fallback check by IP hash for guests
    q = query(
      votesRef,
      where('show_id', '==', showId),
      where('category', '==', category),
      where('voter_ip', '==', voterIpHash)
    );
  }

  const existingVotes = await getDocs(q);
  if (!existingVotes.empty) {
    return { 
      success: false, 
      message: "You have already voted in this category for this show.", 
      weight: 0 
    };
  }

  // 2. Calculate weight
  const weight = await getVoteWeight(voterUid, db);

  // 3. Record vote document
  await addDoc(votesRef, {
    show_id: showId,
    vehicle_id: vehicleId,
    category: category,
    voter_uid: voterUid || 'guest',
    voter_ip: voterIpHash,
    weight,
    timestamp: new Date().toISOString()
  });

  // 4. Update total score in the entrant registry subcollection/mapping
  // Assuming shows have an entrants sub-collection where score/votes are cached
  try {
    const entrantRef = doc(db, 'shows', showId, 'entrants', vehicleId);
    const entrantSnap = await getDoc(entrantRef);
    
    if (entrantSnap.exists()) {
      // Entrant exists in subcollection, increment their vote count
      await updateDoc(entrantRef, {
        [`votes.${category}`]: increment(weight),
        total_score: increment(weight)
      });
    } else {
      // Fallback: Check if the entrant is tracked directly on the main show document array/map
      const showRef = doc(db, 'shows', showId);
      const showSnap = await getDoc(showRef);
      if (showSnap.exists()) {
        const showData = showSnap.data();
        const entrants = showData.entrants || {};
        if (entrants[vehicleId]) {
          const votes = entrants[vehicleId].votes || {};
          votes[category] = (votes[category] || 0) + weight;
          const totalScore = (entrants[vehicleId].total_score || 0) + weight;
          
          entrants[vehicleId] = {
            ...entrants[vehicleId],
            votes,
            total_score: totalScore
          };
          await updateDoc(showRef, { entrants });
        }
      }
    }
  } catch (err) {
    console.warn("Failed to update cached vote totals on show document:", err);
  }

  return {
    success: true,
    message: `Vote cast successfully! Added ${weight} points.`,
    weight
  };
}
