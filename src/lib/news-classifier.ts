import { NewsCategory } from './types/news';

export function classifyMotorsportArticle(title: string, content: string, defaultCategory?: NewsCategory): NewsCategory {
  const tLower = title.toLowerCase();
  const cLower = content.toLowerCase();

  // === STEP 1: HIGH-CONFIDENCE TITLE MATCHING (TITLE TRUMPS BODY TEXT) ===

  // 1. Sim Racing in Title
  if (/\b(iracing|sim racing|gran turismo|assetto corsa|le mans ultimate|rfactor|automobilista|fanatec|moza|simagic)\b/i.test(tLower)) {
    return 'sim_racing';
  }

  // 2. Motorcycles in Title
  if (/\b(motoamerica|motogp|supercross|motocross|superbike|bagger|baggers|twins cup|dirt bike|yamaha r1|ducati|ama pro racing)\b/i.test(tLower)) {
    return 'motorcycles';
  }

  // 3. Drag Racing in Title
  if (/\b(nhra|top fuel|funny car|pro stock|drag racing|dragstrip|small tire|street outlaws|pro mod)\b/i.test(tLower)) {
    return 'drag';
  }

  // 4. Dirt Racing in Title
  if (/\b(world of outlaws|sprint car|sprintcar|sprintcars|late model|late models|dirt track|dirt oval|midgets|knoxville|eldora|usac)\b/i.test(tLower)) {
    return 'dirt';
  }

  // 5. NASCAR / Stock Car in Title
  if (/\b(nascar|cup series|truck series|xfinity|stock car|richmond raceway|talladega|daytona 500|darlington|arca|hendrick|joe gibbs|richard childress|23xi)\b/i.test(tLower)) {
    return 'stock_car';
  }

  // 6. Open Wheel in Title
  if (/\b(formula 1|formula one|\bf1\b|indycar|indy 500|formula 2|formula 3|\bf2\b|\bf3\b|super formula|formula ford|open-wheel|open wheel)\b/i.test(tLower)) {
    return 'open_wheel';
  }

  // 7. Sports Car / Endurance / GT in Title
  if (/\b(imsa|wec|le mans|24 hours|enduro|gt3|gt4|gte|gtd|hypercar|lmdh|supercars|ta2|trans am|porsche 911|bmw m4|toyota supra|mustang gt3|bathurst|nurburgring|carrera cup)\b/i.test(tLower)) {
    return 'sportscar';
  }

  // 8. Car Shows in Title
  if (/\b(car show|concours|radwood|cars and coffee|cruise night|autorama|classic car|shine and show)\b/i.test(tLower)) {
    return 'car_shows';
  }

  // 9. Off-Road & Overlanding in Title
  if (/\b(overland|overlanding|off-road|offroad|baja 1000|king of the hammers|rock crawl|rock crawling|4x4|rubicon|utv|sxs|can-am|polaris rzr|bronco|jeep)\b/i.test(tLower)) {
    return 'offroad_rally';
  }

  // 10. Trackside Camping & RV in Title
  if (/\b(camping|campground|infield camping|rv park|rv pass|rv camping|motorhome|glamping|tent camping|tailgate|tailgating|trackside camping)\b/i.test(tLower)) {
    return 'track_culture';
  }

  // 11. HPDE & Track Days in Title
  if (/\b(hpde|track day|track days|open track|time attack|gridlife|scca track night|nasa hpde|driving school|apex coaching|lapping day|paddock culture)\b/i.test(tLower)) {
    return 'track_culture';
  }

  // === STEP 2: BODY TEXT WEIGHTED HEURISTICS ===
  const text = `${tLower} ${cLower}`;

  if (/\b(iracing|sim racing|gran turismo|assetto corsa|le mans ultimate|fanatec|moza)\b/i.test(text)) {
    return 'sim_racing';
  }
  if (/\b(motoamerica|motogp|supercross|motocross|superbike|baggers|ama pro)\b/i.test(text)) {
    return 'motorcycles';
  }
  if (/\b(nhra|top fuel|funny car|pro stock|drag racing|dragstrip)\b/i.test(text)) {
    return 'drag';
  }
  if (/\b(world of outlaws|sprint car|late model|dirt track|midgets|knoxville)\b/i.test(text)) {
    return 'dirt';
  }
  if (/\b(nascar|cup series|truck series|xfinity|stock car|daytona 500)\b/i.test(text)) {
    return 'stock_car';
  }
  if (/\b(formula 1|formula one|\bf1\b|indycar|indy 500|formula 2|open wheel)\b/i.test(text)) {
    return 'open_wheel';
  }
  if (/\b(imsa|wec|le mans|enduro|gt3|gt4|supercars|ta2|porsche|bmw|corvette)\b/i.test(text)) {
    return 'sportscar';
  }
  if (/\b(car show|concours|radwood|cars and coffee|autorama)\b/i.test(text)) {
    return 'car_shows';
  }
  if (/\b(overland|overlanding|off-road|baja 1000|king of the hammers|rock crawl|4x4|utv)\b/i.test(text)) {
    return 'offroad_rally';
  }
  if (/\b(infield camping|rv camping|rv park|trackside camping|tailgate|glamping)\b/i.test(text)) {
    return 'track_culture';
  }
  if (/\b(hpde|track day|track days|time attack|gridlife|track night|lapping day)\b/i.test(text)) {
    return 'track_culture';
  }

  return defaultCategory || 'sportscar';
}
