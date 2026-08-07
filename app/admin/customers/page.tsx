'use client';

import React, { useEffect, useState } from 'react';
import { api, getHeaders } from '@/lib/api';
import { IconMap } from '@/lib/icons';
import { RefreshCw, Plus, Users, X, Info } from 'lucide-react';

/** Lightweight value selector for source-type properties in customer config.
 *  Admin sets the URL on the property definition; users just pick values here. */
const SourceValueSelector = ({
  sourceUrl,
  propVal,
  multiple,
  onValueChange,
}: {
  sourceUrl: string;
  propVal: any;
  multiple: boolean;
  onValueChange: (v: any) => void;
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl || !sourceUrl.trim()) {
      setData(null);
      return;
    }
    const isUrl = sourceUrl.startsWith('/') || sourceUrl.startsWith('http');
    if (!isUrl) {
      try {
        setData(JSON.parse(sourceUrl));
      } catch {
        setData(sourceUrl);
      }
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const fullUrl = sourceUrl.startsWith('http')
          ? sourceUrl
          : `${BACKEND_URL}${sourceUrl.startsWith('/') ? '' : '/'}${sourceUrl}`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const res = await fetch(fullUrl, { headers });
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
        const json = await res.json();
        if (active) setData(json);
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to fetch');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [sourceUrl]);

  let resolvedData = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
    if (arrayKey) resolvedData = data[arrayKey];
  }

  const isList = Array.isArray(resolvedData);
  const isDict = resolvedData !== null && typeof resolvedData === 'object' && !isList;
  const selectValue = multiple
    ? Array.isArray(propVal)
      ? propVal.map(String)
      : typeof propVal === 'string' && propVal.trim()
        ? propVal.split(',')
        : []
    : String(propVal ?? '');

  const cls =
    'w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm text-black';

  if (!sourceUrl)
    return <span className="text-xs text-gray-400 italic">No source URL configured</span>;

  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          {multiple ? 'Multi-Select' : 'Select Value'}
        </span>
        {loading && <span className="text-[9px] text-blue-500 animate-pulse">Loading...</span>}
        {error && (
          <span className="text-[9px] text-red-500" title={error}>
            Error
          </span>
        )}
      </div>
      {isList ? (
        <select
          className={`${cls} ${multiple ? 'h-24' : ''}`}
          multiple={multiple}
          value={selectValue}
          onChange={(e) => {
            if (multiple) {
              onValueChange(Array.from(e.target.selectedOptions, (o) => o.value));
            } else {
              onValueChange(e.target.value);
            }
          }}
        >
          {!multiple && <option value="">Select option...</option>}
          {resolvedData.map((opt: any) => {
            const val =
              opt && typeof opt === 'object'
                ? (opt.id ?? opt.key ?? opt.value ?? opt.name ?? '')
                : opt;
            const label =
              opt && typeof opt === 'object'
                ? (opt.name ?? opt.label ?? opt.title ?? opt.key ?? opt.id ?? '')
                : opt;
            return (
              <option key={String(val)} value={String(val)}>
                {String(label)}
              </option>
            );
          })}
        </select>
      ) : isDict ? (
        <select
          className={`${cls} ${multiple ? 'h-24' : ''}`}
          multiple={multiple}
          value={selectValue}
          onChange={(e) => {
            if (multiple) {
              onValueChange(Array.from(e.target.selectedOptions, (o) => o.value));
            } else {
              onValueChange(e.target.value);
            }
          }}
        >
          {!multiple && <option value="">Select option...</option>}
          {Object.entries(resolvedData).map(([k, v]) => (
            <option key={k} value={k}>
              {String(v)}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          className={cls}
          value={String(propVal ?? '')}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Value..."
        />
      )}
    </div>
  );
};

export default function CustomersTab() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // Selected Customer detail states
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetailTab, setCustomerDetailTab] = useState<
    'details' | 'users' | 'nodes' | 'metrics'
  >('details');

  // Customer Edit/Onboarding states
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerDomain, setEditCustomerDomain] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [editCustomerContactPerson, setEditCustomerContactPerson] = useState('');
  const [editCustomerStatus, setEditCustomerStatus] = useState('active');
  const [editCustomerPluginsEnabled, setEditCustomerPluginsEnabled] = useState(false);
  const [editCustomerStoragePath, setEditCustomerStoragePath] = useState('');
  const [editCustomerAllowedDomains, setEditCustomerAllowedDomains] = useState<string[]>([]);

  const [customerNodes, setCustomerNodes] = useState<any[]>([]);
  const [customerNodesLoading, setCustomerNodesLoading] = useState(false);
  const [customerTraces, setCustomerTraces] = useState<any[]>([]);
  const [customerMetricsSummary, setCustomerMetricsSummary] = useState<any>(null);
  const [customerTracesLoading, setCustomerTracesLoading] = useState(false);

  // New Customer Onboarding Form
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerDomain, setNewCustomerDomain] = useState('');
  const [newCustomerIcon, setNewCustomerIcon] = useState('Building');
  const [newCustomerColor, setNewCustomerColor] = useState('#2563eb');
  const [newCustomerPluginsEnabled, setNewCustomerPluginsEnabled] = useState(false);
  const [newCustomerStoragePath, setNewCustomerStoragePath] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerContactPerson, setNewCustomerContactPerson] = useState('');
  const [newCustomerAllowedDomains, setNewCustomerAllowedDomains] = useState<string[]>(['legal']);

  // Add Customer User Modal
  const [showAddCustomerUserModal, setShowAddCustomerUserModal] = useState(false);
  const [selectedCustomerIdForUser, setSelectedCustomerIdForUser] = useState<string | null>(null);
  const [customerUserEmail, setCustomerUserEmail] = useState('');
  const [customerUserPassword, setCustomerUserPassword] = useState('');
  const [customerUserName, setCustomerUserName] = useState('');

  // Customer Node Scope (Bulk assignment)
  const [selectedCustomerForNodes, setSelectedCustomerForNodes] = useState<any | null>(null);
  const [showNodesModal, setShowNodesModal] = useState(false);
  const [customerNodeAssignments, setCustomerNodeAssignments] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedNodesForBulk, setSelectedNodesForBulk] = useState<Record<string, boolean>>({});
  const [savingNodes, setSavingNodes] = useState(false);
  const [customerNodeProperties, setCustomerNodeProperties] = useState<
    Record<string, Record<string, any>>
  >({});
  const [configuringNode, setConfiguringNode] = useState<any | null>(null);
  const [nodeSearchQuery, setNodeSearchQuery] = useState('');
  const [nodeViewMode, setNodeViewMode] = useState<'grid' | 'list'>('grid');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const custs = await api.getCustomers().catch(() => []);
      setCustomers(custs || []);
      const usrs = await api.getUsers().catch(() => []);
      setUsers(usrs || []);
      const nodesRes = (await api.getNodes().catch(() => ({ agents: [] }))) as any;
      setAgents(nodesRes.nodes || nodesRes.agents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleTogglePlugins = async (customer: any) => {
    try {
      await api.updateCustomer(customer.id, {
        custom_plugins_enabled: !customer.custom_plugins_enabled,
      });
      fetchInitialData();
    } catch (err: any) {
      alert('Failed to update custom plugins: ' + err.message);
    }
  };

  const handleUpdateStoragePath = async (customer: any) => {
    const path = prompt(
      'Enter custom plugin storage path for ' + customer.name + ':',
      customer.plugin_storage_path || '',
    );
    if (path === null) return;
    try {
      await api.updateCustomer(customer.id, {
        plugin_storage_path: path.trim() || null,
      });
      fetchInitialData();
    } catch (err: any) {
      alert('Failed to update storage path: ' + err.message);
    }
  };

  const loadCustomerNodes = async (cid: string) => {
    setCustomerNodesLoading(true);
    try {
      const nodes = await api.getCustomerNodesAdmin(cid);
      // ==============================================================================
      // ARRAY SAFEGUARD FOR CUSTOMER NODES
      // ==============================================================================
      setCustomerNodes(Array.isArray(nodes) ? nodes : (nodes?.nodes || nodes?.data || []));
    } catch (err: any) {
      alert('Failed to load customer nodes: ' + err.message);
      setCustomerNodes([]);
    } finally {
      setCustomerNodesLoading(false);
    }
  };

  const saveCustomerNodesConfig = async () => {
    if (!selectedCustomer || !Array.isArray(customerNodes)) return;
    try {
      const parsedNodes = customerNodes.map((node) => {
        let props = node.properties;
        if (typeof props === 'string') {
          try {
            props = JSON.parse(props);
          } catch (e) {
            throw new Error(
              `Invalid JSON in property overrides for node ${node.label || node.node_name}`,
            );
          }
        }
        return {
          node_name: node.node_name,
          is_enabled: node.is_enabled,
          properties: props,
          label: node.label,
        };
      });
      await api.configureCustomerNodesAdmin(selectedCustomer.id, parsedNodes);
      alert('Nodes configured successfully!');
      loadCustomerNodes(selectedCustomer.id);
    } catch (err: any) {
      alert('Failed to save nodes config: ' + err.message);
    }
  };

  const loadCustomerTraces = async (cid: string) => {
    setCustomerTracesLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${backendUrl}/api/observability/traces?customer_id=${cid}`, {
        headers,
      });
      const result = await res.json();
      setCustomerTraces(result.traces || []);
      setCustomerMetricsSummary(result.summary || null);
    } catch (err: any) {
      console.error('Failed to load customer traces:', err);
    } finally {
      setCustomerTracesLoading(false);
    }
  };

  const handleSaveCustomerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const updated = await api.updateCustomer(selectedCustomer.id, {
        name: editCustomerName,
        domain: editCustomerDomain,
        email: editCustomerEmail || null,
        address: editCustomerAddress || null,
        contact_person: editCustomerContactPerson || null,
        status: editCustomerStatus,
        custom_plugins_enabled: editCustomerPluginsEnabled,
        plugin_storage_path: editCustomerPluginsEnabled ? editCustomerStoragePath : null,
        allowed_domains: editCustomerAllowedDomains,
      });
      setSelectedCustomer(updated);
      setIsEditingCustomer(false);
      fetchInitialData();
    } catch (err: any) {
      alert('Failed to update customer: ' + err.message);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer({
        name: newCustomerName,
        domain: newCustomerDomain,
        icon: newCustomerIcon,
        color_schema: newCustomerColor,
        custom_plugins_enabled: newCustomerPluginsEnabled,
        plugin_storage_path: newCustomerPluginsEnabled ? newCustomerStoragePath : null,
        email: newCustomerEmail || null,
        address: newCustomerAddress || null,
        contact_person: newCustomerContactPerson || null,
        allowed_domains: newCustomerAllowedDomains,
      });
      setShowAddCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerDomain('');
      setNewCustomerEmail('');
      setNewCustomerAddress('');
      setNewCustomerContactPerson('');
      setNewCustomerPluginsEnabled(false);
      setNewCustomerStoragePath('');
      setNewCustomerAllowedDomains(['legal']);
      fetchInitialData();
    } catch (err: any) {
      alert('Failed to create customer: ' + err.message);
    }
  };

  const handleAddCustomerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomerIdForUser === null) return;
    try {
      await api.createCustomerUser(selectedCustomerIdForUser, {
        name: customerUserName,
        email: customerUserEmail,
        password: customerUserPassword,
        role: 'admin',
      });
      setShowAddCustomerUserModal(false);
      setCustomerUserName('');
      setCustomerUserEmail('');
      setCustomerUserPassword('');
      fetchInitialData();
    } catch (err: any) {
      alert('Failed to add admin user: ' + err.message);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this customer? This will also delete all of their users.',
      )
    )
      return;
    try {
      await api.deleteCustomer(id);
      fetchInitialData();
    } catch (err: any) {
      alert('Failed to delete customer: ' + err.message);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (
      !confirm(`Are you sure you want to delete ${targetUser.email_id || targetUser.username}?`)
    ) {
      return;
    }
    try {
      await api.deleteUser(targetUser.id);
      fetchInitialData();
    } catch (err: any) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  // Node Scoping Handlers
  const handleManageCustomerNodes = async (customer: any) => {
    setSelectedCustomerForNodes(customer);
    setCustomerNodeAssignments({});
    setSelectedNodesForBulk({});
    setCustomerNodeProperties({});
    setConfiguringNode(null);
    setNodeSearchQuery('');
    try {
      const res = await api.getCustomerNodesAdmin(customer.id);
      const assignments: Record<string, boolean> = {};
      const properties: Record<string, Record<string, any>> = {};
      if (res && res.configs) {
        res.configs.forEach((c: any) => {
          assignments[c.node_name] = c.is_enabled;
          properties[c.node_name] = c.properties || {};
        });
      }
      setCustomerNodeAssignments(assignments);
      setCustomerNodeProperties(properties);
      setShowNodesModal(true);
    } catch (err: any) {
      alert('Failed to load customer node configurations: ' + err.message);
    }
  };

  const handleSaveCustomerNodes = async () => {
    if (!selectedCustomerForNodes) return;
    setSavingNodes(true);
    try {
      const nodesPayload = agents.map((agent: any) => {
        const nodeName = agent.name;
        const is_enabled = !!customerNodeAssignments[nodeName];
        const properties = customerNodeProperties[nodeName] || {};
        return {
          node_name: nodeName,
          is_enabled: is_enabled,
          properties: properties,
        };
      });

      await api.configureCustomerNodesAdmin(selectedCustomerForNodes.id, nodesPayload);
      setShowNodesModal(false);
    } catch (err: any) {
      alert('Failed to save assignments: ' + err.message);
    } finally {
      setSavingNodes(false);
    }
  };

  const handleToggleSingleAssignment = (nodeName: string) => {
    setCustomerNodeAssignments((prev) => ({
      ...prev,
      [nodeName]: !prev[nodeName],
    }));
  };

  /* BLOCK COMMENT: Toggle isolated node testing allowed state for customer node (defaults to false) */
  const handleToggleTestingAllowed = (nodeName: string) => {
    setCustomerNodeProperties((prev) => {
      const currentProps = prev[nodeName] || {};
      const currentTesting = currentProps.allow_node_testing === true;
      return {
        ...prev,
        [nodeName]: {
          ...currentProps,
          allow_node_testing: !currentTesting,
        },
      };
    });
  };

  const handleBulkToggle = (enable: boolean) => {
    const nextAssignments = { ...customerNodeAssignments };
    Object.keys(selectedNodesForBulk).forEach((nodeName) => {
      if (selectedNodesForBulk[nodeName]) {
        nextAssignments[nodeName] = enable;
      }
    });
    setCustomerNodeAssignments(nextAssignments);
    setSelectedNodesForBulk({});
  };

  const handleSelectAllForBulk = () => {
    const nextBulk: Record<string, boolean> = {};
    agents.forEach((agent: any) => {
      nextBulk[agent.name] = true;
    });
    setSelectedNodesForBulk(nextBulk);
  };

  const handleDeselectAllForBulk = () => {
    setSelectedNodesForBulk({});
  };

  const handleBulkEnableAll = () => {
    const nextAssignments: Record<string, boolean> = {};
    agents.forEach((agent: any) => {
      nextAssignments[agent.name] = true;
    });
    setCustomerNodeAssignments(nextAssignments);
  };

  const handleBulkDisableAll = () => {
    const nextAssignments: Record<string, boolean> = {};
    agents.forEach((agent: any) => {
      nextAssignments[agent.name] = false;
    });
    setCustomerNodeAssignments(nextAssignments);
  };

  const renderCustomerPropertyInput = (entry: any, val: any, nodeName: string) => {
    const handleValChange = (v: any) => {
      setCustomerNodeProperties((prev) => ({
        ...prev,
        [nodeName]: {
          ...(prev[nodeName] || {}),
          [entry.key]: v,
        },
      }));
    };
    const commonClasses =
      'w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm text-black';

    if (
      entry.type === 'password' ||
      entry.type?.toLowerCase().includes('secret') ||
      entry.type?.toLowerCase().includes('key')
    ) {
      return (
        <input
          type="password"
          className={commonClasses}
          value={String(val ?? '')}
          placeholder="••••••••"
          autoComplete="new-password"
          onChange={(e) => handleValChange(e.target.value)}
        />
      );
    }

    if (entry.type === 'source') {
      const sourceUrl = entry.source || '';
      const propVal = val !== undefined && val !== null ? val : '';

      return (
        <SourceValueSelector
          sourceUrl={sourceUrl}
          propVal={propVal}
          multiple={!!entry.multiple}
          onValueChange={(newVal: any) => handleValChange(newVal)}
        />
      );
    }

    if (entry.type === 'boolean') {
      return (
        <select
          className={commonClasses}
          value={String(val ?? false)}
          onChange={(e) => handleValChange(e.target.value === 'true')}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    return (
      <input
        className={`${commonClasses} text-black`}
        value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
        placeholder="Enter value..."
        onChange={(e) => handleValChange(e.target.value)}
      />
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-sm">Loading tenants registry...</div>;
  }

  return (
    <>
      {selectedCustomer ? (
        <div className="space-y-6">
          {/* Back Button and Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer"
              >
                ← Back to Customers
              </button>
              <div>
                <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedCustomer.color_schema || '#2563eb' }}
                  ></span>
                  {selectedCustomer.name}
                </h2>
                <span className="text-xs text-gray-500 font-mono">
                  ID: {selectedCustomer.id} | Domain: {selectedCustomer.domain}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditCustomerName(selectedCustomer.name);
                  setEditCustomerDomain(selectedCustomer.domain || '');
                  setEditCustomerEmail(selectedCustomer.email || '');
                  setEditCustomerAddress(selectedCustomer.address || '');
                  setEditCustomerContactPerson(selectedCustomer.contact_person || '');
                  setEditCustomerStatus(selectedCustomer.status || 'active');
                  setEditCustomerPluginsEnabled(selectedCustomer.custom_plugins_enabled || false);
                  setEditCustomerStoragePath(selectedCustomer.plugin_storage_path || '');
                  setEditCustomerAllowedDomains(selectedCustomer.allowed_domains || []);
                  setIsEditingCustomer(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer"
              >
                Edit
              </button>

              {selectedCustomer.id !== 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this customer?')) {
                      handleDeleteCustomer(selectedCustomer.id);
                      setSelectedCustomer(null);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-655 px-4 py-2 text-sm font-semibold text-white hover:bg-red-755 shadow-sm cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Sub navigation tabs */}
          <div className="flex border-b border-gray-200 gap-6">
            {[
              { id: 'details', label: 'Details & Info' },
              { id: 'users', label: 'Users Management' },
              { id: 'nodes', label: 'Allowed Nodes' },
              { id: 'metrics', label: 'Activity & Metrics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setCustomerDetailTab(tab.id as any);
                  if (tab.id === 'nodes') {
                    loadCustomerNodes(selectedCustomer.id);
                  } else if (tab.id === 'metrics') {
                    loadCustomerTraces(selectedCustomer.id);
                  }
                }}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${customerDetailTab === tab.id
                  ? 'border-bg-primary text-bg-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {customerDetailTab === 'details' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              {isEditingCustomer ? (
                <form onSubmit={handleSaveCustomerDetails} className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editCustomerName}
                        onChange={(e) => setEditCustomerName(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Domain
                      </label>
                      <input
                        type="text"
                        required
                        value={editCustomerDomain}
                        onChange={(e) => setEditCustomerDomain(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editCustomerEmail}
                        onChange={(e) => setEditCustomerEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                        placeholder="billing@tenant.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={editCustomerContactPerson}
                        onChange={(e) => setEditCustomerContactPerson(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Address
                    </label>
                    <textarea
                      rows={2}
                      value={editCustomerAddress}
                      onChange={(e) => setEditCustomerAddress(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                      placeholder="123 Business Rd, Suite 100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Status
                      </label>
                      <select
                        value={editCustomerStatus}
                        onChange={(e) => setEditCustomerStatus(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Custom Plugins
                      </label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="editCustomerPluginsEnabled"
                          checked={editCustomerPluginsEnabled}
                          onChange={(e) => setEditCustomerPluginsEnabled(e.target.checked)}
                          className="rounded text-bg-primary focus:ring-blue-500 w-4.5 h-4.5"
                        />
                        <label
                          htmlFor="editCustomerPluginsEnabled"
                          className="text-sm text-gray-600 font-medium"
                        >
                          Enabled
                        </label>
                      </div>
                    </div>
                  </div>
                  {editCustomerPluginsEnabled && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                        Plugin Storage Path
                      </label>
                      <input
                        type="text"
                        value={editCustomerStoragePath}
                        onChange={(e) => setEditCustomerStoragePath(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                        placeholder="plugins/nodes/client/1"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                      Allowed Domains
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'legal', label: 'Legal' },
                        { key: 'finance', label: 'Finance' },
                        { key: 'healthcare', label: 'Healthcare' },
                        { key: 'hr', label: 'HR' },
                        { key: 'general', label: 'General' },
                      ].map((d) => {
                        const isSelected = editCustomerAllowedDomains.includes(d.key);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditCustomerAllowedDomains(
                                  editCustomerAllowedDomains.filter((x) => x !== d.key),
                                );
                              } else {
                                setEditCustomerAllowedDomains([...editCustomerAllowedDomains, d.key]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                          >
                            {d.label} {isSelected ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="bg-primary px-4 py-2 text-sm font-bold text-white rounded-lg hover:bg-blue-700 shadow-sm cursor-pointer"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(false)}
                      className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">
                        Domain name
                      </span>
                      <span className="text-sm font-semibold text-black">
                        {selectedCustomer.domain}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">
                        Email address
                      </span>
                      <span className="text-sm font-semibold text-black">
                        {selectedCustomer.email || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">
                        Contact person
                      </span>
                      <span className="text-sm font-semibold text-black">
                        {selectedCustomer.contact_person || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">
                        Status
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase inline-block mt-1 ${selectedCustomer.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                          }`}
                      >
                        {selectedCustomer.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">
                        Allowed Domains
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedCustomer.allowed_domains && selectedCustomer.allowed_domains.length > 0 ? (
                          selectedCustomer.allowed_domains.map((dom: string) => (
                            <span
                              key={dom}
                              className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase"
                            >
                              {dom}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None assigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">
                        Address
                      </span>
                      <span className="text-sm font-semibold text-black block whitespace-pre-line leading-relaxed">
                        {selectedCustomer.address || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">
                        Custom Plugins
                      </span>
                      <span className="text-sm font-semibold text-black block mt-1">
                        {selectedCustomer.custom_plugins_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {selectedCustomer.custom_plugins_enabled && (
                      <div>
                        <span className="block text-[10px] text-gray-400 uppercase font-bold">
                          Plugin Storage Path
                        </span>
                        <span className="text-sm font-mono font-semibold text-black block mt-1">
                          {selectedCustomer.plugin_storage_path || 'Default'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {customerDetailTab === 'users' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center pb-2">
                <div>
                  <h4 className="text-md font-bold text-black">Customer Users</h4>
                  <p className="text-xs text-gray-500">
                    Manage directory users and admins associated with this tenant.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomerIdForUser(selectedCustomer.id);
                    setShowAddCustomerUserModal(true);
                  }}
                  className="bg-primary px-3 py-1.5 text-xs font-bold text-white rounded-lg hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  + Add Tenant User
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                      Username
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users
                    .filter((u) => u.customer_id === selectedCustomer.id)
                    .map((u, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-black font-semibold">
                          {u.name} ({u.username})
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono capitalize">
                          {u.role}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.status === 'active'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                              }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {u.role !== 'system_admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="text-red-650 hover:text-red-750 font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  {users.filter((u) => u.customer_id === selectedCustomer.id).length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-500 text-xs font-medium"
                      >
                        No users registered for this tenant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {customerDetailTab === 'nodes' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h4 className="text-md font-bold text-black">Nodes Catalog Access</h4>
                  <p className="text-xs text-gray-500 font-medium">
                    Enable or disable specific node access and customize parameters for this tenant.
                  </p>
                </div>
                <button
                  onClick={saveCustomerNodesConfig}
                  className="bg-primary px-4 py-2 text-xs font-bold text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  Save Config
                </button>
              </div>
              {customerNodesLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading customer nodes...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {/* ==============================================================================
                  // ARRAY SAFEGUARD FOR CUSTOMER NODES RENDERING
                  // ============================================================================== */}
                  {Array.isArray(customerNodes) && customerNodes.length > 0 ? (
                    customerNodes.map((n, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-sm font-semibold text-black">
                              {n.label || n.node_name}
                            </h5>
                            <span className="text-[10px] text-gray-400 font-mono">
                              Type: {n.node_name}
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={n.is_enabled}
                              onChange={(e) => {
                                const updated = [...(Array.isArray(customerNodes) ? customerNodes : [])];
                                updated[idx] = { ...updated[idx], is_enabled: e.target.checked };
                                setCustomerNodes(updated);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                            Custom Overrides (JSON)
                          </label>
                          <textarea
                            rows={2}
                            value={
                              typeof n.properties === 'string'
                                ? n.properties
                                : JSON.stringify(n.properties || {})
                            }
                            onChange={(e) => {
                              const updated = [...(Array.isArray(customerNodes) ? customerNodes : [])];
                              updated[idx] = { ...updated[idx], properties: e.target.value };
                              setCustomerNodes(updated);
                            }}
                            placeholder="{}"
                            className="w-full text-xs font-mono rounded-lg border border-gray-200 p-2 text-black focus:border-bg-primary focus:outline-none bg-white"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-8 text-center text-sm text-gray-500">
                      No nodes available for this customer.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {customerDetailTab === 'metrics' && (
            <div className="bg-white border border-gray-250 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-gray-150">
                <div>
                  <h4 className="text-md font-bold text-black font-semibold">
                    Observability Trace Log
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    Live trace records for workflows running on {selectedCustomer.name}.
                  </p>
                </div>
              </div>
              {customerMetricsSummary && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
                    <span className="block text-xs font-bold text-gray-500 uppercase">
                      Total Requests
                    </span>
                    <span className="text-2xl font-bold text-bg-primary">
                      {customerMetricsSummary.total_requests}
                    </span>
                  </div>
                  <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
                    <span className="block text-xs font-bold text-gray-500 uppercase">
                      Avg Latency
                    </span>
                    <span className="text-2xl font-bold text-bg-primary">
                      {customerMetricsSummary.avg_latency_ms}ms
                    </span>
                  </div>
                  <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
                    <span className="block text-xs font-bold text-gray-500 uppercase">
                      Error Rate
                    </span>
                    <span className="text-2xl font-bold text-red-600">
                      {customerMetricsSummary.error_rate}%
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Trace ID
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Workflow
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-mono text-xs">
                      {customerTracesLoading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-6 text-center text-gray-500 text-xs font-medium"
                          >
                            Loading traces...
                          </td>
                        </tr>
                      ) : (
                        customerTraces.map((m, idx) => (
                          <tr key={idx} className="hover:bg-gray-55">
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(m.timestamp * 1000).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-800 font-semibold">{m.trace_id}</td>
                            <td className="px-4 py-3 text-gray-800 font-semibold">
                              {m.workflow_id}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'success' || m.status === 'completed'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                                  }`}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                      {!customerTracesLoading && customerTraces.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-8 text-center text-gray-500 text-xs font-medium"
                          >
                            No activity or execution traces recorded in current time range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconMap.users className="h-5 w-5 text-gray-400" />
              <h2 className="text-xl font-semibold text-black">Customer Management</h2>
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
            >
              <IconMap.plus className="h-4 w-4" /> Add Customer
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-fade-in">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                    Plugin Name
                  </th>
                  <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                    Domain Name
                  </th>
                  <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                    Allowed Domains
                  </th>
                  <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                    Custom Plugins
                  </th>
                  <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                    Plugins Storage Path
                  </th>
                  <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Status</th>
                  <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((c, i) => (
                  <tr
                    key={i}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerDetailTab('details');
                    }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-black font-medium flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: c.color_schema || '#2563eb' }}
                      ></span>
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.domain}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {c.allowed_domains && c.allowed_domains.length > 0 ? (
                          c.allowed_domains.map((dom: string) => (
                            <span
                              key={dom}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase"
                            >
                              {dom}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={c.custom_plugins_enabled || false}
                          onChange={() => handleTogglePlugins(c)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {c.plugin_storage_path || 'Default'}
                        </span>
                        <button
                          onClick={() => handleUpdateStoragePath(c)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Edit Storage Path"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${c.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                          }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm flex gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setSelectedCustomerIdForUser(c.id);
                          setShowAddCustomerUserModal(true);
                        }}
                        className="text-bg-primary hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Add Admin User
                      </button>
                      <button
                        onClick={() => handleManageCustomerNodes(c)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        Manage Nodes
                      </button>
                      {c.id !== 0 &&
                        c.name?.toLowerCase() !== 'system' &&
                        c.name?.toLowerCase() !== 'system account' &&
                        c.name?.toLowerCase() !== 'system_account' &&
                        c.domain?.toLowerCase() !== 'system' && (
                          <button
                            onClick={() => handleDeleteCustomer(c.id)}
                            className="text-red-900 hover:text-red-750 font-normal cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500 text-sm font-medium">
                      No customers configured. Click "Add Customer" to configure the first tenant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-black mb-4">Add Customer Tenant</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerDomain}
                  onChange={(e) => setNewCustomerDomain(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                  placeholder="e.g. acme"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Icon Name
                  </label>
                  <input
                    type="text"
                    value={newCustomerIcon}
                    onChange={(e) => setNewCustomerIcon(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Color Schema
                  </label>
                  <input
                    type="color"
                    value={newCustomerColor}
                    onChange={(e) => setNewCustomerColor(e.target.value)}
                    className="w-full h-10 border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                    placeholder="billing@tenant.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newCustomerContactPerson}
                    onChange={(e) => setNewCustomerContactPerson(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                  placeholder="123 Corporate Way, City, State"
                />
              </div>
              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Allowed Knowledge Domains
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'legal', label: 'Legal' },
                      { key: 'finance', label: 'Finance' },
                      { key: 'healthcare', label: 'Healthcare' },
                      { key: 'hr', label: 'HR' },
                      { key: 'general', label: 'General' },
                    ].map((d) => {
                      const isSelected = newCustomerAllowedDomains.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewCustomerAllowedDomains(
                                newCustomerAllowedDomains.filter((x) => x !== d.key),
                              );
                            } else {
                              setNewCustomerAllowedDomains([...newCustomerAllowedDomains, d.key]);
                            }
                          }}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all border cursor-pointer ${isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {d.label} {isSelected ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <input
                    type="checkbox"
                    id="newCustomerPluginsEnabled"
                    checked={newCustomerPluginsEnabled}
                    onChange={(e) => setNewCustomerPluginsEnabled(e.target.checked)}
                    className="rounded text-bg-primary focus:ring-blue-500 w-4.5 h-4.5"
                  />
                  <label
                    htmlFor="newCustomerPluginsEnabled"
                    className="text-xs font-bold uppercase text-gray-500 cursor-pointer"
                  >
                    Enable Custom Plugins
                  </label>
                </div>
                {newCustomerPluginsEnabled && (
                  <div className="mt-3">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Plugins Storage Path
                    </label>
                    <input
                      type="text"
                      value={newCustomerStoragePath}
                      onChange={(e) => setNewCustomerStoragePath(e.target.value)}
                      className="w-full rounded-lg border border-gray-250 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                      placeholder="e.g. plugins/nodes/acme"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer User Modal */}
      {showAddCustomerUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-black mb-4">Onboard Customer Admin User</h3>
            <form onSubmit={handleAddCustomerUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Admin Name
                </label>
                <input
                  type="text"
                  required
                  value={customerUserName}
                  onChange={(e) => setCustomerUserName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={customerUserEmail}
                  onChange={(e) => setCustomerUserEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                  placeholder="e.g. admin@acme.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={customerUserPassword}
                  onChange={(e) => setCustomerUserPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none bg-white"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerUserModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Onboard Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Customer Nodes Modal */}
      {showNodesModal && selectedCustomerForNodes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-155">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <div>
                <h3 className="text-lg font-bold text-black">
                  Manage Customer Nodes: {selectedCustomerForNodes.name}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Assign which nodes are active for this customer, and configure specific defaults
                  or credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNodesModal(false)}
                className="text-gray-400 hover:text-gray-650 transition-colors cursor-pointer"
              >
                <IconMap.x className="h-6 w-6" />
              </button>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 flex overflow-hidden">
              {configuringNode ? (
                /* Designing/Configuring Single Node Sub-view */
                <div className="flex-1 flex flex-col h-full bg-white">
                  <div className="border-b px-4 py-3 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <button
                        type="button"
                        onClick={() => setConfiguringNode(null)}
                        className="hover:text-bg-primary transition-colors cursor-pointer"
                      >
                        Node Library
                      </button>
                      <span>&gt;</span>
                      <span className="text-gray-900 font-bold">
                        {configuringNode.label || configuringNode.name} Override
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfiguringNode(null)}
                      className="text-xs text-bg-primary font-bold hover:underline cursor-pointer"
                    >
                      Back to Catalog
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-bg-primary border flex-shrink-0">
                        {IconMap[configuringNode.icon] ? (
                          React.createElement(IconMap[configuringNode.icon], {
                            className: 'h-6 w-6',
                          })
                        ) : (
                          <Info className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-black text-base">
                          {configuringNode.label || configuringNode.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {configuringNode.description || 'No description available for this node.'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Configure Overrides
                      </h5>
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                        <div>
                          These properties override the global default values specifically for runs
                          originating from{' '}
                          <span className="font-bold">{selectedCustomerForNodes.name}</span>.
                          Sensitive values (like passwords or API keys) are saved securely.
                        </div>
                      </div>

                      {/* BLOCK COMMENT: Isolated Node Testing (Debug Mode) toggle switch */}
                      <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-purple-900">
                            Isolated Node Testing (Debug Mode)
                          </h5>
                          <p className="text-[11px] text-purple-700 mt-0.5">
                            Allow administrators & developers to execute single-node playground tests in isolation for this tenant.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={(customerNodeProperties[configuringNode.name] || {}).allow_node_testing === true}
                            onChange={() => handleToggleTestingAllowed(configuringNode.name)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                      </div>

                      {/* Overrides form */}
                      <div className="space-y-4 max-w-xl">
                        {configuringNode.properties?.length > 0 ? (
                          configuringNode.properties.map((prop: any) => {
                            const val = (customerNodeProperties[configuringNode.name] || {})[
                              prop.key
                            ];
                            return (
                              <div key={prop.key} className="space-y-1.5">
                                <div className="flex justify-between">
                                  <label className="text-xs font-semibold text-gray-700">
                                    {prop.label || prop.key}
                                  </label>
                                  <span className="text-[10px] text-gray-400 font-mono capitalize">
                                    {prop.type || 'string'}
                                  </span>
                                </div>
                                {prop.description && (
                                  <p className="text-[10px] text-gray-500 leading-normal">
                                    {prop.description}
                                  </p>
                                )}
                                {renderCustomerPropertyInput(prop, val, configuringNode.name)}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-gray-500 italic py-4">
                            No configurable properties defined for this node.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t bg-gray-50 px-6 py-3 flex justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfiguringNode(null)}
                      className="bg-primary hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm cursor-pointer"
                    >
                      Done Override
                    </button>
                  </div>
                </div>
              ) : (
                /* Node list / Grid Library view */
                <div className="flex-1 flex flex-col h-full bg-slate-50/20">
                  {/* Sub-header actions */}
                  <div className="px-4 py-3 bg-white border-b flex items-center justify-between shrink-0 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          value={nodeSearchQuery}
                          onChange={(e) => setNodeSearchQuery(e.target.value)}
                          placeholder="Search nodes..."
                          className="w-48 bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-black focus:outline-none focus:border-bg-primary"
                        />
                        <IconMap.search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      </div>

                      {/* Bulk Controls */}
                      {Object.keys(selectedNodesForBulk).filter((k) => selectedNodesForBulk[k])
                        .length > 0 && (
                          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg p-0.5 animate-fade-in">
                            <button
                              type="button"
                              onClick={() => handleBulkToggle(true)}
                              className="px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-white rounded transition-all cursor-pointer"
                            >
                              Enable
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkToggle(false)}
                              className="px-2 py-1 text-[10px] font-bold text-red-750 hover:bg-white rounded transition-all cursor-pointer"
                            >
                              Disable
                            </button>
                          </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleSelectAllForBulk}
                          className="text-[10px] text-gray-500 hover:text-bg-primary font-bold hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300 text-xs">|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllForBulk}
                          className="text-[10px] text-gray-500 hover:text-bg-primary font-bold hover:underline cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleBulkEnableAll}
                          className="text-[10px] text-bg-primary font-bold hover:underline cursor-pointer"
                        >
                          Enable All
                        </button>
                        <span className="text-gray-300 text-xs">|</span>
                        <button
                          type="button"
                          onClick={handleBulkDisableAll}
                          className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                        >
                          Disable All
                        </button>
                      </div>

                      {/* Layout Mode */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border">
                        <button
                          type="button"
                          onClick={() => setNodeViewMode('grid')}
                          className={`p-1 rounded cursor-pointer ${nodeViewMode === 'grid'
                            ? 'bg-white shadow-xs text-bg-primary'
                            : 'text-gray-400 hover:text-gray-655'
                            }`}
                        >
                          <IconMap.workflow className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNodeViewMode('list')}
                          className={`p-1 rounded cursor-pointer ${nodeViewMode === 'list'
                            ? 'bg-white shadow-xs text-bg-primary'
                            : 'text-gray-400 hover:text-gray-655'
                            }`}
                        >
                          <IconMap.list className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Node Library Grid/List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {nodeViewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {agents
                          .filter(
                            (n) =>
                              !nodeSearchQuery.trim() ||
                              n.name.toLowerCase().includes(nodeSearchQuery.toLowerCase()),
                          )
                          .map((node) => {
                            const isChecked = !!customerNodeAssignments[node.name];
                            const isSelectForBulk = !!selectedNodesForBulk[node.name];

                            return (
                              <div
                                key={node.name}
                                className={`border rounded-xl p-4 bg-white flex flex-col justify-between shadow-xs transition-all relative ${isChecked ? 'border-blue-200' : 'border-gray-200 opacity-75'
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelectForBulk}
                                      onChange={(e) =>
                                        setSelectedNodesForBulk((prev) => ({
                                          ...prev,
                                          [node.name]: e.target.checked,
                                        }))
                                      }
                                      className="rounded border-gray-300 text-bg-primary focus:ring-blue-500 mt-1 h-3.5 w-3.5"
                                    />
                                    <div className="h-10 w-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-gray-550 flex-shrink-0">
                                      {IconMap[node.icon] ? (
                                        React.createElement(IconMap[node.icon], {
                                          className: 'h-5 w-5',
                                        })
                                      ) : (
                                        <Info className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-black">
                                        {node.label || node.name}
                                      </h5>
                                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                        {node.name}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Toggle Node Allowed */}
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleSingleAssignment(node.name)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                                  </label>
                                </div>

                                <div className="mt-3 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                  {node.description || 'No description available.'}
                                </div>

                                <div className="border-t mt-4 pt-3 flex justify-between items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${isChecked
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : 'bg-red-50 text-red-700 border-red-100'
                                        }`}
                                    >
                                      {isChecked ? 'Allowed' : 'Disallowed'}
                                    </span>
                                    {/* BLOCK COMMENT: Testing Allowed toggle badge in Grid View */}
                                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100" title="Toggle isolated node testing (debug mode)">
                                      <input
                                        type="checkbox"
                                        checked={(customerNodeProperties[node.name] || {}).allow_node_testing === true}
                                        onChange={() => handleToggleTestingAllowed(node.name)}
                                        className="accent-purple-600 h-3 w-3 cursor-pointer"
                                      />
                                      Testing
                                    </label>
                                  </div>
                                  {isChecked && (
                                    <button
                                      type="button"
                                      onClick={() => setConfiguringNode(node)}
                                      className="text-xs text-bg-primary font-bold hover:underline cursor-pointer"
                                    >
                                      Configure Override
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      /* List Mode */
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2.5 font-bold text-gray-500 uppercase w-8"></th>
                              <th className="px-4 py-2.5 font-bold text-gray-500 uppercase">
                                Node Type / ID
                              </th>
                              <th className="px-4 py-2.5 font-bold text-gray-500 uppercase">
                                Description
                              </th>
                              <th className="px-4 py-2.5 font-bold text-gray-500 uppercase text-center w-24">
                                Allowed
                              </th>
                              {/* BLOCK COMMENT: Testing Allowed Column Header */}
                              <th className="px-4 py-2.5 font-bold text-gray-500 uppercase text-center w-32">
                                Testing Allowed
                              </th>
                              <th className="px-4 py-2.5 font-bold text-gray-500 uppercase text-right w-36"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {agents
                              .filter(
                                (n) =>
                                  !nodeSearchQuery.trim() ||
                                  n.name.toLowerCase().includes(nodeSearchQuery.toLowerCase()),
                              )
                              .map((node) => {
                                const isChecked = !!customerNodeAssignments[node.name];
                                const isSelectForBulk = !!selectedNodesForBulk[node.name];

                                return (
                                  <tr key={node.name} className="hover:bg-slate-55">
                                    <td className="px-4 py-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelectForBulk}
                                        onChange={(e) =>
                                          setSelectedNodesForBulk((prev) => ({
                                            ...prev,
                                            [node.name]: e.target.checked,
                                          }))
                                        }
                                        className="rounded border-gray-300 text-bg-primary h-3.5 w-3.5"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded bg-gray-50 flex items-center justify-center text-gray-400 border shrink-0">
                                          {IconMap[node.icon] ? (
                                            React.createElement(IconMap[node.icon], {
                                              className: 'h-3.5 w-3.5',
                                            })
                                          ) : (
                                            <Info className="h-3.5 w-3.5" />
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-bold text-black">
                                            {node.label || node.name}
                                          </div>
                                          <div className="text-[9px] text-gray-450 font-mono">
                                            {node.name}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 truncate max-w-sm">
                                      {node.description}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleSingleAssignment(node.name)}
                                        className="rounded border-gray-300 text-bg-primary w-4 h-4 cursor-pointer"
                                      />
                                    </td>
                                    {/* BLOCK COMMENT: Testing Allowed toggle checkbox cell */}
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={
                                          (customerNodeProperties[node.name] || {}).allow_node_testing === true
                                        }
                                        onChange={() => handleToggleTestingAllowed(node.name)}
                                        className="rounded border-gray-300 text-purple-600 w-4 h-4 cursor-pointer"
                                        title="Toggle isolated node testing (debug mode) for this node"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {isChecked && (
                                        <button
                                          type="button"
                                          onClick={() => setConfiguringNode(node)}
                                          className="text-blue-650 hover:text-blue-800 font-bold cursor-pointer"
                                        >
                                          Configure
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            {!configuringNode && (
              <div className="border-t bg-gray-55 px-4 py-3 flex justify-between shrink-0">
                <span className="text-[10px] text-gray-400 font-bold pt-2 uppercase">
                  {
                    Object.keys(customerNodeAssignments).filter((k) => customerNodeAssignments[k])
                      .length
                  }{' '}
                  Nodes Allowed
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNodesModal(false)}
                    className="border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomerNodes}
                    disabled={savingNodes}
                    className="bg-primary hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingNodes ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
                    Save Node Assignments
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
