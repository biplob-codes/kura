import FolderSetup from "../components/FolderSetup";

const Settings = () => {
  return (
    <div className="w-full max-w-4xl mx-auto py-5">
      <h1 className="text-base font-semibold text-gray-900">
        Set up your folders
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose where kura should look for new videos, and where sorted videos
        should live.
      </p>

      <FolderSetup />
    </div>
  );
};

export default Settings;
