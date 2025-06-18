"use client";

import { useState, useEffect } from "react";
import { Client, CreateClientInput, UpdateClientInput } from "@/types/database";
import { Notification } from "@/components/Notification";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useClients";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";

export default function ClientsPage() {
  const { user } = useAuth();
  const {
    clients,
    loading,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients();
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateClientInput>({
    name: "",
    hourly_rate: 0,
    currency: "USD",
    email: "",
    address: "",
  });

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.hourly_rate) {
      setNotification({
        type: "error",
        message: "Please fill in client name and hourly rate",
      });
      return;
    }

    setFormLoading(true);

    try {
      let result;
      if (editingClient) {
        const updateData: UpdateClientInput = {
          name: formData.name,
          hourly_rate: formData.hourly_rate,
          currency: formData.currency,
          ...(formData.email && { email: formData.email }),
          ...(formData.address && { address: formData.address }),
        };
        result = await updateClient(editingClient.id, updateData);
        if (result.success) {
          setNotification({
            type: "success",
            message: "Client updated successfully",
          });
          setEditingClient(null);
        } else {
          setNotification({
            type: "error",
            message: result.error || "Failed to update client",
          });
        }
      } else {
        result = await createClient(formData, user.id);
        if (result.success) {
          setNotification({
            type: "success",
            message: "Client created successfully",
          });
        } else {
          setNotification({
            type: "error",
            message: result.error || "Failed to create client",
          });
        }
      }

      if (result.success) {
        // Reset form
        setFormData({
          name: "",
          hourly_rate: 0,
          currency: "USD",
          email: "",
          address: "",
        });
      }
    } catch {
      setNotification({ type: "error", message: "Failed to save client" });
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) return;

    const result = await deleteClient(id);
    if (result.success) {
      setNotification({
        type: "success",
        message: "Client deactivated successfully",
      });
    } else {
      setNotification({
        type: "error",
        message: result.error || "Failed to delete client",
      });
    }
  }

  function handleEdit(client: Client) {
    setEditingClient(client);
    setFormData({
      name: client.name,
      hourly_rate: client.hourly_rate,
      currency: client.currency,
      email: client.email || "",
      address: client.address || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingClient(null);
    setFormData({
      name: "",
      hourly_rate: 0,
      currency: "USD",
      email: "",
      address: "",
    });
    // setShowForm(false)
  }

  return (
    <div className="w-full py-8 px-8">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Client Form */}
        <div className="mb-8">
          <div className="relative my-8 h-16 w-full border border-violet-300 rounded-xl">
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Client name"
              className="block w-full h-full pl-4 pr-20 rounded-2xl text-l text-gray-700 placeholder:text-gray-400 focus:outline-none"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <div className="h-full flex items-center px-2 border-l border-violet-300">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email"
                  className="h-full w-32 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="h-full flex items-center px-2 border-l border-violet-300">
                <input
                  type="number"
                  name="hourly_rate"
                  id="hourly_rate"
                  placeholder="Rate"
                  min="0"
                  step="1"
                  className="h-full w-16 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none text-center"
                  value={formData.hourly_rate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hourly_rate: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="h-full flex items-center px-2 border-l border-violet-300">
                <select
                  id="currency"
                  name="currency"
                  className="h-full w-16 bg-transparent text-sm text-gray-700 focus:outline-none"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>

              <div className="px-5 flex items-center h-full bg-violet-600 rounded-r-[0.7rem]">
                <div
                  className="text-sm text-violet-100 bg-violet-600 cursor-pointer hover:text-violet-400"
                  onClick={handleSubmit}
                >
                  {formLoading
                    ? "Saving..."
                    : editingClient
                    ? "Update"
                    : "Save"}
                </div>
              </div>
            </div>
          </div>

          {/* Address field on separate line if needed */}
          {(formData.address || editingClient) && (
            <div className="relative mt-4 h-12 w-full border border-violet-300 rounded-xl">
              <input
                type="text"
                name="address"
                id="address"
                placeholder="Address (optional)"
                className="block w-full h-full pl-4 pr-4 rounded-2xl text-l text-gray-700 placeholder:text-gray-400 focus:outline-none"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          )}

          {editingClient && (
            <div className="mt-4 flex gap-2">
              <Button type="button" onClick={cancelEdit} variant="secondary">
                Cancel Edit
              </Button>
            </div>
          )}
        </div>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Your Clients</h2>
          </CardHeader>

          {loading ? (
            <CardContent className="text-center">
              <p className="text-gray-500">Loading clients...</p>
            </CardContent>
          ) : clients.length === 0 ? (
            <CardContent className="text-center">
              <p className="text-gray-500 mb-4">
                No clients yet. Add your first client to get started!
              </p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className={client.is_active ? "" : "opacity-50"}
                  >
                    <TableCell>
                      <div className="font-medium">{client.name}</div>
                      {client.address && (
                        <div className="text-sm text-gray-500">
                          {client.address}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>
                      {client.currency} {client.hourly_rate}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {client.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleEdit(client)}
                        variant="ghost"
                        size="sm"
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      {client.is_active && (
                        <Button
                          onClick={() => handleDelete(client.id, client.name)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
