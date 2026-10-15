import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import {
  ModelCardItem,
  ModelCardSkeleton,
  type ModelCard,
} from "../components/ModelCard";

export default function Models() {
  const [models, setModels] = useState<ModelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    invoke<ModelCard[]>("get_models")
      .then((result) => {
        if (!cancelled) setModels(result);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6 text-sm text-neutral-400">
          <p className="font-medium text-neutral-200">Couldn't load models</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!loading && models.length === 0) {
    return (
      <div className="p-6">
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-700 text-sm text-neutral-500">
          No models yet
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <ModelCardSkeleton key={i} />
            ))
          : models.map((model) => (
              <ModelCardItem key={model.id} model={model} />
            ))}
      </div>
    </div>
  );
}
