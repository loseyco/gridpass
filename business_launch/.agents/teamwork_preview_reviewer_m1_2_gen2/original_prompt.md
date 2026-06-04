## 2026-05-22T15:05:12Z
You are a High-reliability review agent. Your working directory is c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_reviewer_m1_2_gen2.
Your mission is to review the implementation of Milestone 1 in both `find_leads.py` and `test_leads.py`.

Please review the changes made by the worker:
1. Refined URL normalization (`norm_domain`) in `find_leads.py` and `test_leads.py` to support hybrid base-domain collapsing for standard businesses and path/query preservation for shared/government portals.
2. CLI category mapping and fallback loop sequentially iterating over track, offroad, and car_club when `--category all` is invoked.
3. Crawler subpage constraints in `crawl_website` to avoid hopping between distinct venues on shared portals.

Tasks to execute:
1. Run syntax and compile checks on `find_leads.py` and `test_leads.py`.
2. Run the test suite: `python -m unittest test_leads.py` and capture the output.
3. Thoroughly inspect the code changes to ensure correctness, robustness, and compliance with all criteria in `PROJECT.md`.
4. Provide a clear PASS/FAIL verdict and write a detailed report to `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_reviewer_m1_2_gen2\review.md`, and a structured `handoff.md` following the Handoff Protocol.

(Remember: you must propose and run the unittest command via run_command, and explain to the user that they must approve it for the test verification to complete.)
