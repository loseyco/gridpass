# Install Visual Studio Build Tools 2022 using Winget
echo "Starting Visual Studio Build Tools Installation..."
echo "Please click 'Yes' on the User Account Control (Admin) prompt if it appears."

# Install VS Build Tools 2022 with C++ Desktop Workload
# --passive: Shows progress but doesn't require interaction
# --wait: Waits for completion
# --force: Forces install even if partial
winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --force --accept-package-agreements --accept-source-agreements --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

echo "Installation command finished. Please check if the installer completed successfully."
