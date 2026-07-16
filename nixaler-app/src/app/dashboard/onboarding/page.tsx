import { getMyFormation, updateFormationInfoAction } from '@/lib/actions/onboarding';
import LlcStepper from '@/components/onboarding/LlcStepper';

export default async function OnboardingPage() {
  const formation = await getMyFormation();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LLC & onboarding</h1>
        <p className="mt-1 text-sm text-ink-muted">
          We advance this as your filing actually happens — updates land here, not the other way
          around.
        </p>
      </div>

      {formation && (
        <div className="rounded-lg border border-border bg-bg-raised p-6">
          <LlcStepper status={formation.status} />
        </div>
      )}

      <form action={updateFormationInfoAction} className="max-w-md space-y-4">
        <h2 className="font-medium">Business details</h2>
        <div className="space-y-1">
          <label className="text-sm text-ink-muted" htmlFor="businessName">
            Business name
          </label>
          <input
            id="businessName"
            name="businessName"
            defaultValue={formation?.businessName ?? ''}
            required
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-ink-muted" htmlFor="formationState">
            State of formation
          </label>
          <input
            id="formationState"
            name="formationState"
            defaultValue={formation?.formationState ?? ''}
            placeholder="e.g. Delaware"
            required
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink hover:opacity-90 transition"
        >
          Save details
        </button>
      </form>
    </div>
  );
}
