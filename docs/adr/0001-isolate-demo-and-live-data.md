# Isolate demo and live data behind shared feature contracts

LocalLoop must support a complete recruiter journey without credentials or a backend. As required by the product brief, screens use shared data contracts with separate persistent local demo and Supabase adapters. Demo changes never reach Supabase; this duplicates some adapter behavior but makes offline demonstrations independent of backend availability and keeps fictional activity separate from real accounts.
