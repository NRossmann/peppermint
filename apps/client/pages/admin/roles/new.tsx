import { Permission, PERMISSIONS_CONFIG } from "@/shadcn/lib/types/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { getCookie } from "cookies-next";
import { Search } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Roles() {
  const [step, setStep] = useState(1);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    [],
  );
  const [roleName, setRoleName] = useState("");
  const [authentikGroupName, setAuthentikGroupName] = useState("");
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAddRole = async () => {
    if (!roleName) return;

    await fetch("/api/v1/role/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roleName,
        authentikGroupName,
        isAdminRole,
        permissions: selectedPermissions,
        users: selectedUsers,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          router.push("/admin/roles");
        }
      });
  };

  const handleSelectCategory = (category: string, isSelected: boolean) => {
    const categoryPermissions =
      PERMISSIONS_CONFIG.find((group) => group.category === category)
        ?.permissions || [];

    if (isSelected) {
      const newPermissions = [
        ...selectedPermissions,
        ...categoryPermissions.filter(
          (p: Permission) => !selectedPermissions.includes(p),
        ),
      ];
      setSelectedPermissions(newPermissions);
    } else {
      setSelectedPermissions(
        selectedPermissions.filter(
          // @ts-ignore
          (p: Permission) => !categoryPermissions.includes(p),
        ),
      );
    }
  };

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions =
      PERMISSIONS_CONFIG.find((group) => group.category === category)
        ?.permissions || [];
    return categoryPermissions.every((p) => selectedPermissions.includes(p));
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/users/all", {
        headers: {
          Authorization: `Bearer ${getCookie("session")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (step === 2) {
      fetchUsers();
    }
  }, [step]);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center">
          <div
            className={`flex items-center ${
              step === 1 ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                step === 1
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300"
              }`}
            >
              1
            </div>
            <span className="ml-2">Configure Role</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-4 ${
              step === 2 ? "bg-blue-600" : "bg-gray-300"
            }`}
          ></div>
          <div
            className={`flex items-center ${
              step === 2 ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                step === 2
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300"
              }`}
            >
              2
            </div>
            <span className="ml-2">Select Users</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <div className="flex flex-row justify-between items-center">
              <div className="flex gap-3 w-full max-w-2xl">
                <Input
                  placeholder="Role Name"
                  value={roleName}
                  className="w-1/2"
                  onChange={(e) => setRoleName(e.target.value)}
                />
                <Input
                  placeholder="Authentik group name"
                  value={authentikGroupName}
                  className="w-1/2"
                  onChange={(e) => setAuthentikGroupName(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 ml-4 text-sm whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isAdminRole}
                  onChange={(e) => setIsAdminRole(e.target.checked)}
                />
                <span>Admin role</span>
              </label>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => setStep(2)}
                disabled={!roleName}
              >
                Next
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              If you set an Authentik group name here, OIDC logins will
              synchronize this role from the userinfo group claims and overwrite
              manual role assignments for that user.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Admin roles grant full admin access to members, including users
              assigned through Authentik group sync.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Select Permissions</h3>
              {PERMISSIONS_CONFIG.map((group) => (
                <div key={group.category} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{group.category}</h4>
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={isCategoryFullySelected(group.category)}
                        onChange={(e) =>
                          handleSelectCategory(group.category, e.target.checked)
                        }
                        className="rounded"
                      />
                      <span>Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([
                                ...selectedPermissions,
                                permission,
                              ]);
                            } else {
                              setSelectedPermissions(
                                selectedPermissions.filter(
                                  (p) => p !== permission,
                                ),
                              );
                            }
                          }}
                        />
                        <span>{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-row justify-between items-center">
              <CardTitle>Select Users</CardTitle>
              <div className="flex gap-2">
                <button
                  className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-500"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-500"
                  onClick={handleAddRole}
                  disabled={isLoading}
                >
                  Create Role
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {isLoading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center space-x-2 rounded border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(
                              selectedUsers.filter((id) => id !== user.id),
                            );
                          }
                        }}
                        className="rounded"
                      />
                      <span className="flex-1">{user.email}</span>
                    </label>
                  ))}
                </div>
              )}

              {!isLoading && filteredUsers.length === 0 && (
                <div className="py-4 text-center text-gray-500 dark:text-gray-300">
                  {searchTerm ? "No users found" : "No users available"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
