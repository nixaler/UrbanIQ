import { listMyContacts } from '@/lib/actions/crm';
import ContactForm from '@/components/crm/ContactForm';
import ContactList from '@/components/crm/ContactList';

export default async function CrmPage() {
  const contacts = await listMyContacts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="mt-1 text-sm text-ink-muted">Your customers and leads — not niXaler&apos;s.</p>
      </div>
      <ContactForm />
      <ContactList contacts={contacts} />
    </div>
  );
}
