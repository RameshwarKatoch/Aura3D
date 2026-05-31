import SmartRecipeGenerator from './SmartRecipeGenerator';
// We'll mock a profile if not provided, or better, we should pass it.
// Looking at App.tsx, PantryManager was called without props.
// I'll make it take profile or use a default.

export default function PantryManager() {
  // In a real app, we'd get this from a store.
  // For now, we'll assume a default non_veg preference if not in a profile context.
  const dietaryPreference = 'non_veg'; 

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-main tracking-tight">Pantry Management</h1>
        <p className="text-text-muted text-sm mt-1">Manage your ingredients and generate high-protein meals</p>
      </div>
      
      <SmartRecipeGenerator dietaryPreference={dietaryPreference} />
    </div>
  );
}

