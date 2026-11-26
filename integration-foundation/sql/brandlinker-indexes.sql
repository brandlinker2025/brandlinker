create index bl_agreements_partner_idx on public.bl_agreements(partner_id);
create index bl_agreements_approver_idx on public.bl_agreements(approved_by);
create index bl_jobs_platform_idx on public.bl_jobs(platform_id);
create index bl_leads_platform_idx on public.bl_leads(platform_id);
create index bl_jobs_queue_idx on public.bl_jobs(state,created_at);
create index bl_leads_stage_idx on public.bl_leads(platform_id,stage,created_at);
