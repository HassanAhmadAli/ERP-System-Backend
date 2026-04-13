CREATE OR REPLACE FUNCTION log_complaint_update() RETURNS TRIGGER AS $$ BEGIN -- On any update, insert the old and new row data as JSONB into the audit table
    IF (TG_OP = 'UPDATE') THEN
INSERT INTO public."Complaint_audit" (complaint_id, operation_type, old_data, new_data)
VALUES (OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
END IF;
-- Return the new row to allow the+ original update operation to complete
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 
-- Drop the trigger if it already exists to avoid errors on re-creation
DROP TRIGGER IF EXISTS complaint_after_update_trigger ON public."Complaint";
-- Create the trigger
CREATE TRIGGER complaint_after_update_trigger
AFTER
UPDATE ON public."Complaint" FOR EACH ROW EXECUTE FUNCTION log_complaint_update();