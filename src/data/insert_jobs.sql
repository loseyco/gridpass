
-- Create Tables (Idempotent)
create table if not exists public.scraped_listings (
  id uuid default gen_random_uuid() primary key,
  title text,
  description text,
  origin_author_name text,
  origin_source text default 'facebook',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.scraped_candidates (
  id uuid default gen_random_uuid() primary key,
  full_name text,
  experience_summary text,
  origin_source text default 'facebook',
  status text default 'unclaimed',
  created_at timestamptz default now()
);

-- Inserts
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Jason Alder February 5 at 5:30 PM   · CDL Driver Needed – Stratus Racing Stratus Racing is looking for a CDL driver to haul our race team’s hauler from Plainfield, IN to Sonoma Raceway (Sonoma, CA) and help with basic race-weekend duties (fuel, tires, hospitality, general paddock support, etc.). Requirements: See more All reactions: 10 Nicolli Karolini and 9 others 6 comments Like Comment Send View more comments Nicolli Karolini I don’t have a cdl but I can help with hospitality and general support! Even getting some training for fuel and tires. 3d Like Reply Clint Ogle I just sent you a message! 3d Like Reply 2 Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Bob Gosch Admin Group expert All-star contributor   · February 4 at 8:09 PM   · Meyer Shank Racing February 4 at 1:53 PM   · We’re Hiring! �Looking for a Transport Driver / IndyCar Tire Technician.… See more All reactions: 19 19 4 comments Like Comment Send View more comments Bob Gosch Author Admin Group expert All-star contributor The job location for the Transport Driver/IndyCar Tire Technician position at Meyer Shank Racing is Pataskala, Ohio. Their headquarters is located at 3001 Etna Parkway, Pataskala, OH 43062. Meyer Shank Racing is an American motorsport organization that… See more 4d Like Reply 3 View all 2 replies Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Brisman Ricardo Palacin Vargas February 6 at 5:19 PM   · Race & Data Engineer With the 2026 season very close to begin, I am looking to fill my race calendar and explore opportunities across different championships. Currently I am working as Race Engineer in the Imsa Michelin Pilot Challenge in the TCR class. Additionally, I have experience working in BTCC last year in some races as Data Engineer and in the past I worked in TCR UK, Civic Cup with Radical prototypes and LMP3.… See more All reactions: 8 8 1 comment Like Comment Send Ryan Croucher I Highly recommend Brisman! 2d Like Reply Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_candidates (full_name, experience_summary) VALUES ('Facebook Facebook', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook RaceStaff.com Top contributor   · February 6 at 5:20 PM   · Haas F1 Team are seeking an IT Support Technician (Heritage).… See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook RaceStaff.com Top contributor   · February 6 at 5:19 PM   · The Motorsport Competence Group AG is looking for a motivated and qualified truck driver at our headquarters in St. Ingbert at the earliest possible date.… See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_candidates (full_name, experience_summary) VALUES ('Facebook Facebook', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook RaceStaff.com Top contributor   · February 6 at 5:19 PM   · BMW M Team WRT GTP Programme (Kannapolis,NC / USA) are seeking a Gearbox Technician.… See more All reactions: 9 Nicolli Karolini and 8 others Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Miguel Jose Sanchez February 5 at 5:30 PM   · XO9 Racing is Hiring – Full-Time Race Technician XO9 Racing is expanding and looking for a full-time experienced race technician to join our team. What you’ll work on… See more All reactions: 21 Bob Gosch and 20 others 3 comments Like Comment Send View more comments David Rivera Damn bro so close but so far 2d Like Reply Miguel Jose Sanchez Author Up 3d Like Reply Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Miguel Jose Sanchez January 11 at 7:40 PM   · XO9 racing looking for local (chicago area) two drivers for two seperate rigs, main rig and support rig. Other duties - Tires and fuel over the weekend. 1st rig - 20 weekends , 14 race weekends and 6 test weekends. 2nd rig 6 or 11 weekends. TBD. … See more All reactions: 29 Nicolli Karolini and 28 others 5 comments Like Comment Send View more comments Foggy Foggy Sent email 4w Like Reply Miguel Jose Sanchez Author Up! Still looking 3d Like Reply Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook RaceStaff.com Top contributor   · February 6 at 9:49 AM   · Motorsport Competence Group (Team ROWE Racing) is looking for a structured, hands-on and highly communicative Workshop Operations Manager / Head of Workshop Operations … See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_candidates (full_name, experience_summary) VALUES ('Facebook Facebook', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Tristan Kababe February 5 at 5:31 PM   · Hello to all Hiring Managers, I am seeking a full-time Fueler position in IMSA or the WeatherTech Championship. I have over three years of experience fueling at the professional level, including Motorsports In Action (IMSA GS, GSX, McLaren Trophy) and TPC Racing in Porsche Sprint and Endurance. I am experienced in everything fuel, Pit lane Set up and execution in pit stops under pressure. I am looking to continue working full-time at the IMSA/WeatherTech level. See more All reactions: 6 Nicolli Karolini and 5 others 1 comment Like Comment Send Trevor Griffin Great guy, very willing to learn as well! 3d Like Reply Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Robert Kirsch February 5 at 5:27 PM   · To whom this may concern. My name is Robert Kirsch, and I’m currently part of the repair department at Fibreworks Composites. I’m reaching out to express my strong interest in joining the motorsports industry—a field I’m truly passionate about.t With a background in composite repair and hands-on experience from my education, I’m eager to apply my skills and continue learning within a high-performance environment. I’m motivated, detai… See more All reactions: 5 5 1 comment Like Comment Send Rick Stevenson If you''re really wanting to get into the industry then you got to go where the race shops are. Phone calls emails are going to be ignored if you want to impress you show up in person that''s how you apply for a job anybody can send an email 3d Like Reply Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook F', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Buster Laningham February 5 at 5:28 PM   · TOPP Racing is looking for a car lead for this coming up season in carrera cup and sprint challenge. Possibly have 2 car lead positions available for porsche sprint challenge. Also we are looking for a full time in shop mechanic as well, we are based out of motorport ranch cresson tx. Preferably be familiar with cup cars and cayman. Please pm me for further info. You can send resume to buster@toppracing.com All reactions: 46 Brad Roberts, Dave Skeen and 44 others 3 comments Like Comment Send Kyle Downs Top contributor Damn, i would love to do it 3d Like Reply 2 View 1 reply Matt Young Great group of guys, excellently run organization, defending champs across Sprint and Carrera for a reason. 3d Like Reply Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Buster Laningham
February 5 at 5:28 PM
 
·
TOPP Racing  is looking for a car lead for this coming up season in carrera cup and sprint challenge. Possibly have 2 car lead positions available for porsche sprint challenge.
Also we are looking for a full time in shop mechanic as well, we are based out of motorport ranch cresson tx.
Preferably  be familiar with cup cars and cayman.
Please pm me for further info.
You can send resume to buster@toppracing.com
All reactions:
46
Brad Roberts, Dave Skeen and 44 others
3 comments
Like
Comment
Send
Kyle Downs
Top contributor
Damn, i would love to do it
3d
Like
Reply
2
View 1 reply
Matt Young
Great group of guys, excellently run organization, defending champs across Sprint and Carrera for a reason.
3d
Like
Reply




Comment as Pj
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook F', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Bob Gosch Admin Group expert All-star contributor   · February 5 at 9:40 PM   · Kalitta Motorsports  February 5 at 12:17 PM   · WE’RE HIRING!… See more All reactions: 6 6 Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Bob Gosch
Admin
Group expert
All-star contributor
 
·
February 5 at 9:40 PM
 
·
Kalitta Motorsports 
February 5 at 12:17 PM
 
·
WE’RE HIRING!… See more
All reactions:
6
6
Like
Comment
Send




Comment as Pj
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook F', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Joe R. Wells is feeling motivated. February 5 at 5:28 PM   · Hi everyone! My name is Joe Wells, owner and lead designer at GB22 Designs. I’m currently looking to partner with race teams and drivers for the 2026 season. I specialize in motorsports livery design, with experience across ARCA and the NASCAR Xfinity Series, including projects for the O’Reilly Series era. I’ve had the opportunity to design for an Earnhardt, and I’ve also worked with teams to translate real world liveries into offic… See more All reactions: 4 Nicolli Karolini and 3 others 4 comments Like Comment Send View more comments Chandler Fiveash Highly recommend Joe 3d Like Reply Kobe Cantin Joe is amazing, highly recommend him! 3d Like Reply Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Joe R. Wells is  feeling motivated.
February 5 at 5:28 PM
 
·
Hi everyone!
My name is Joe Wells, owner and lead designer at GB22 Designs. I’m currently looking to partner with race teams and drivers for the 2026 season.
I specialize in motorsports livery design, with experience across ARCA and the NASCAR Xfinity Series, including projects for the O’Reilly Series era. I’ve had the opportunity to design for an Earnhardt, and I’ve also worked with teams to translate real world liveries into offic… See more
All reactions:
4
Nicolli Karolini and 3 others
4 comments
Like
Comment
Send
View more comments
Chandler Fiveash
Highly recommend Joe
3d
Like
Reply
Kobe Cantin
Joe is amazing, highly recommend him!
3d
Like
Reply




Comment as Pj
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook F', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Samuel Huntsberger February 5 at 5:27 PM   · Hey y’all! Im a young guy fixing to finally enter into the motorsports world. I’m in southeast Ohio, and am willing to take on a volunteer position at any teams in my area! Given enough time to prepare, I’ll absolutely commute as far as needed!! All reactions: 1 Nicolli Karolini 2 comments Like Comment Send Ed Ignacio Wach Volunteering is an excellent way to start in the industry and build your network. The Southern Ohio Forest Rally is in your backyard and needs volunteers to run smoothly every year. 3d Like Reply J.D. Ellis Meyer Shank aren''t far from you with Indycar and IMSA GTP programs. Otherwise, ask around Columbus-based The Ohio Valley Region of the SCCA, OVR for opportunities to volunteer with local club racers. The Ohio Valley Region of the SCCA, OVR The Ohio Valley Region of the SCCA, OVR 3d Like Reply Answer as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Samuel Huntsberger
February 5 at 5:27 PM
 
·
Hey y’all!
Im a young guy fixing to finally enter into the motorsports world. I’m in southeast Ohio, and am willing to take on a volunteer position at any teams in my area! Given enough time to prepare, I’ll absolutely commute as far as needed!!
All reactions:
1
Nicolli Karolini
2 comments
Like
Comment
Send
Ed Ignacio Wach
Volunteering is an excellent way to start in the industry and build your network. The 
Southern Ohio Forest Rally is in your backyard and needs volunteers to run smoothly every year.
3d
Like
Reply
J.D. Ellis
Meyer Shank aren''t far from you with Indycar and IMSA GTP programs.
Otherwise, ask around Columbus-based 
The Ohio Valley Region of the SCCA, OVR for opportunities to volunteer with local club racers.
The Ohio Valley Region of the SCCA, OVR
The Ohio Valley Region of the SCCA, OVR
3d
Like
Reply




Answer as Pj
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook F', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Track Team Driver - TTD February 5 at 5:33 PM   · Race-weekend decisions don’t happen in isolation.… See more Track Team Driver - TTD February 2 at 11:18 AM   · Race weekends aren’t driven by one person or a single call. They rely on structured workflows across engineering, strategy, operations, and communication.… See more All reactions: 1 Nicolli Karolini Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Track Team Driver - TTD
February 5 at 5:33 PM
 
·
Race-weekend decisions don’t happen in isolation.… See more
Track Team Driver - TTD
February 2 at 11:18 AM
 
·
Race weekends aren’t driven by one person or a single call.
They rely on structured workflows across engineering, strategy, operations, and communication.… See more
All reactions:
1
Nicolli Karolini
Like
Comment
Send




Comment as Pj
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook F', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Luca Viavattene February 5 at 5:31 PM   · Motorsports Sales Account - Indianapolis, USA Would you like to work in a dynamic, international environment? Motorsports training is a key asset in preparing for the world of racing and trackside work.… See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Luca Viavattene
February 5 at 5:31 PM
 
·
Motorsports Sales Account - Indianapolis, USA
Would you like to work in a dynamic, international environment?
Motorsports training is a key asset in preparing for the world of racing and trackside work.… See more
Like
Comment
Send




Comment as Pj
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook
Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Brandon Tipton February 5 at 5:30 PM   · https://www.facebook.com/share/p/1DZYybGj7j/?mibextid=wwXIfr Haas Factory Team  January 24 at 9:15 AM   · 𝙒𝙀 𝘼𝙍𝙀 𝙃𝙄𝙍𝙄𝙉𝙂! Social Me… See more All reactions: 2 2 Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Scott Schulhofer February 5 at 5:30 PM   · Hello Everyone, My name is Scott Schulhofer and I am looking for any opportunity to get my hands dirty in the field of motorsport. Ideally this would include the opportunity to shadow team engineers to learn what it takes to succeed in this environment. I have a degree in mechanical engineering with a background in test engineering and vehicle dynamics. I am easily adaptable and have the work ethic to back that up. My goal is to learn and build relationships in motorsport so th… See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_candidates (full_name, experience_summary) VALUES ('Facebook Facebook', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook RaceStaff.com Top contributor   · February 5 at 5:29 PM   · Haas F1 Team are seeking a RTS Lead Sub Assembly Technician. General Summary: This position reports to the RTS Chief Mechanic or his designee; is located in Banbury, UK. Responsible for the assembly and servicing of the Haas F1 car components and leadership of the Sub Assembly department. See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook');
INSERT INTO public.scraped_candidates (full_name, experience_summary) VALUES ('Facebook Facebook', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook RaceStaff.com Top contributor   · February 5 at 5:27 PM   · Haas F1 Team are seeking a Senior Sub Assembly Technician. General Summary: This position reports to the RTS Chief Mechanic or their designee; is located in Banbury, UK. Responsible for the assembly and servicing of the Haas Formula 1 Race Car components. See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook RaceStaff.com Top contributor   · February 4 at 8:04 PM   · Jordan Racing Team (Lichfield / UK) are looking for a part time Truckie to join their team for Historic events across the UK and Europe. A clean HGV Class 1 Licence is … See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook RaceStaff.com Top contributor   · February 4 at 8:04 PM   · An opportunity has arisen for a No 1 Mechanic to join the Jaguar TCS Racing department in an exciting work environment. About the role To manage all test car and assembly build activities ensuring Technical Drawings and Bulletins are captured and adhered to, relevant spares are defined and available and that build schedules are followed. Provide trackside vehicle build and lead test mechanics group for all test events. See more Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Justin Flenniken February 1 at 8:14 PM   · Anyone in the Elizabeth City area (maybe within a couple of hours) I could come talk to. I''m looking for HR types that could give me some insights about getting into the industry. I have nine years military F15C/D fighter maintenance, twelve years working as an F15SA Aero Repair Technician with two years as an Air Force Certified Aviation Maintenance Instructor. My specialty is flight controls, landing gear, and canopy systems remo… See more All reactions: 1 1 5 comments Like Comment Send Jesse Stoudt Definitely have to be more specific in what you''re looking for. 6d Like Reply View all 3 replies Joe Thomas As a veteran, check out Operation Motorsport its an avenue for veterans to get into racing. 1w Like Reply 2 Answer as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Bob Gosch Admin Group expert All-star contributor   · February 3 at 1:12 AM   · ChaLew Performance, LLC is with MSI Racing Products. January 31 at 2:53 PM   · ChaLew Performance, LLC and MSI Racing Products are expanding, and we’re looking for motivated individuals to join our team.… See more All reactions: 8 8 2 comments Like Comment Send Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Donald Tanner Photography February 3 at 2:47 AM   · Motorsports Photographer – VP Challenge / SRO GTWC (COTA) I’m a Texas-based motorsports photographer currently exploring team coverage opportunities for the upcoming VP Racing SportsCar Challenge and/or SRO GT World Challenge weekend at COTA. I specialize in on-track action, paddock, and team-focused storytelling, with experience covering GT and time-attack platforms at COTA and other major circuits. Ideal fit would be team media support (race weekend coverage, sponsor assets, … See more DONALDTANNERPHOTOGRAPHY.COM portfolio — Donald Tanner Photography Like Comment Send Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('New Opportunity', 'Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Sami Yahya February 1 at 8:15 PM   · Hi everyone. Wondering if there might be any job opportunities for me in Charlotte NC area preferably oval racing related and works with my schedule as a student Little bit about me:… See more All reactions: 3 3 5 comments Like Comment Send Tim Giesen Best thing to do is when you get to NC spend a few days going to smaller shops. Find you a late model or arca team you can help on weekends. Be hard to find something while in school. Most shops are 7 to 4-5ish. A lot of teams looking for help right no… See more 1w Like Reply 3 View all 3 replies Mike Blankenship Stay in school and finish what you started. Learn and network, attend the school''s job fairs, talk to the instructors and John Dodson. They have connections that can help, but they only put their names on students they know and trust to do good work. W… See more 6d Like Reply 2 Comment as Pj Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook', 'Facebook Facebook');
