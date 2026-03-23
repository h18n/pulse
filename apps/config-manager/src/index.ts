import Fastify from 'fastify';
import Handlebars from 'handlebars';
import { pino } from 'pino';


const logger = pino({
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

const fastify = Fastify({ logger: true });

// In-memory device inventory (in production, this would be a database)
interface Device {
  id: string;
  name: string;
  type: 'switch' | 'router' | 'pdu' | 'sensor' | 'server' | 'service';
  ip: string;
  snmpCommunity?: string;
  snmpVersion?: 2 | 3;
  region: string;
  siteCode: string;
  enabled: boolean;
  protocols: ('snmp' | 'ping' | 'gnmi' | 'http')[];
  dependsOn?: string[]; // IDs of devices this device depends on
}

const deviceInventory: Map<string, Device> = new Map([
  ['dev-001', {
    id: 'dev-001',
    name: 'core-rtr-nyc-01',
    type: 'router',
    ip: '10.0.1.1',
    snmpCommunity: 'public',
    snmpVersion: 2,
    region: 'US-EAST',
    siteCode: 'NYC-DC-01',
    enabled: true,
    protocols: ['snmp', 'ping', 'gnmi']
  }],
  ['dev-002', {
    id: 'dev-002',
    name: 'access-sw-nyc-01',
    type: 'switch',
    ip: '10.0.1.10',
    snmpCommunity: 'public',
    snmpVersion: 2,
    region: 'US-EAST',
    siteCode: 'NYC-DC-01',
    enabled: true,
    protocols: ['snmp', 'ping'],
    dependsOn: ['dev-001']
  }],
  ['dev-003', {
    id: 'dev-003',
    name: 'pdu-rack42-lon',
    type: 'pdu',
    ip: '10.0.2.100',
    region: 'EU-WEST',
    siteCode: 'LON-DC-05',
    enabled: true,
    protocols: ['snmp', 'http']
  }],
  ['dev-004', {
    id: 'dev-004',
    name: 'temp-sensor-sfo-01',
    type: 'sensor',
    ip: '10.0.3.50',
    region: 'US-WEST',
    siteCode: 'SFO-DC-03',
    enabled: true,
    protocols: ['http']
  }],
  ['svc-checkout', {
    id: 'svc-checkout',
    name: 'checkout-service',
    type: 'service',
    ip: '172.16.0.10',
    region: 'US-EAST',
    siteCode: 'NYC-DC-01',
    enabled: true,
    protocols: ['http'],
    dependsOn: ['dev-002', 'svc-payment']
  }],
  ['svc-payment', {
    id: 'svc-payment',
    name: 'payment-gateway',
    type: 'service',
    ip: '172.16.0.20',
    region: 'US-EAST',
    siteCode: 'NYC-DC-01',
    enabled: true,
    protocols: ['http'],
    dependsOn: ['dev-002']
  }]
]);

// Telegraf TOML Template
const telegrafTemplate = Handlebars.compile(`# Auto-generated Telegraf Configuration
# Generated at: {{generatedAt}}
# Region: {{region}}

[agent]
  interval = "10s"
  round_interval = true
  metric_batch_size = 1000
  metric_buffer_limit = 10000
  flush_interval = "10s"
  hostname = "telegraf-{{region}}"

[global_tags]
  region = "{{region}}"

[[outputs.prometheus_client]]
  listen = ":9273"
  metric_version = 2

# ============== PING TARGETS ==============
{{#if pingTargets.length}}
[[inputs.ping]]
  urls = [{{#each pingTargets}}"{{this.ip}}"{{#unless @last}}, {{/unless}}{{/each}}]
  count = 3
  ping_interval = 1.0
  timeout = 2.0
  [inputs.ping.tags]
    source = "telegraf-{{region}}"
{{/if}}

# ============== SNMP DEVICES ==============
{{#each snmpDevices}}
[[inputs.snmp]]
  agents = ["udp://{{this.ip}}:161"]
  version = {{this.snmpVersion}}
  community = "{{this.snmpCommunity}}"
  interval = "60s"
  timeout = "10s"
  retries = 3
  
  [inputs.snmp.tags]
    device_name = "{{this.name}}"
    device_type = "{{this.type}}"
    site_code = "{{this.siteCode}}"

  # System Info
  [[inputs.snmp.field]]
    name = "hostname"
    oid = "RFC1213-MIB::sysName.0"
    is_tag = true

  [[inputs.snmp.field]]
    name = "uptime"
    oid = "RFC1213-MIB::sysUpTime.0"

  # Interface Stats
  [[inputs.snmp.table]]
    name = "interface"
    inherit_tags = ["hostname"]

    [[inputs.snmp.table.field]]
      name = "ifDescr"
      oid = "IF-MIB::ifDescr"
      is_tag = true

    [[inputs.snmp.table.field]]
      name = "ifHCInOctets"
      oid = "IF-MIB::ifHCInOctets"

    [[inputs.snmp.table.field]]
      name = "ifHCOutOctets"
      oid = "IF-MIB::ifHCOutOctets"

    [[inputs.snmp.table.field]]
      name = "ifOperStatus"
      oid = "IF-MIB::ifOperStatus"

{{/each}}

# ============== gNMI DEVICES ==============
{{#each gnmiDevices}}
[[inputs.gnmi]]
  addresses = ["{{this.ip}}:6030"]
  username = "admin"
  password = "admin"
  encoding = "proto"
  redial = "10s"

  [inputs.gnmi.tags]
    device_name = "{{this.name}}"
    site_code = "{{this.siteCode}}"

  [[inputs.gnmi.subscription]]
    name = "interface_counters"
    origin = "openconfig"
    path = "/interfaces/interface/state/counters"
    subscription_mode = "sample"
    sample_interval = "10s"

  [[inputs.gnmi.subscription]]
    name = "cpu_utilization"
    origin = "openconfig"
    path = "/components/component/cpu/utilization"
    subscription_mode = "sample"
    sample_interval = "30s"

{{/each}}

# ============== HTTP ENDPOINTS ==============
{{#each httpDevices}}
[[inputs.http]]
  urls = ["http://{{this.ip}}/api/metrics"]
  timeout = "5s"
  method = "GET"
  data_format = "json"
  
  [inputs.http.tags]
    device_name = "{{this.name}}"
    device_type = "{{this.type}}"
    site_code = "{{this.siteCode}}"

{{/each}}
`);

// CRUD: List all devices
fastify.get('/api/devices', async () => {
  return Array.from(deviceInventory.values());
});

// CRUD: Get single device
fastify.get('/api/devices/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const device = deviceInventory.get(id);
  if (!device) return reply.status(404).send({ error: 'Device not found' });
  return device;
});

// CRUD: Create device
fastify.post('/api/devices', async (request, reply) => {
  const device = request.body as Device;
  device.id = `dev-${Date.now()}`;
  deviceInventory.set(device.id, device);
  logger.info(`Device created: ${device.name}`);
  return { status: 'created', device };
});

// CRUD: Update device
fastify.put('/api/devices/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  if (!deviceInventory.has(id)) {
    return reply.status(404).send({ error: 'Device not found' });
  }
  const device = { ...request.body as Device, id };
  deviceInventory.set(id, device);
  logger.info(`Device updated: ${device.name}`);
  return { status: 'updated', device };
});

// CRUD: Delete device
fastify.delete('/api/devices/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  if (!deviceInventory.has(id)) {
    return reply.status(404).send({ error: 'Device not found' });
  }
  deviceInventory.delete(id);
  logger.info(`Device deleted: ${id}`);
  return { status: 'deleted', id };
});

// Generate Telegraf config for a region
fastify.get('/api/config/telegraf/:region', async (request, reply) => {
  const { region } = request.params as { region: string };

  const devices = Array.from(deviceInventory.values())
    .filter(d => d.region === region && d.enabled);

  if (devices.length === 0) {
    return reply.status(404).send({ error: `No devices found for region: ${region}` });
  }

  const pingTargets = devices.filter(d => d.protocols.includes('ping'));
  const snmpDevices = devices.filter(d => d.protocols.includes('snmp'));
  const gnmiDevices = devices.filter(d => d.protocols.includes('gnmi'));
  const httpDevices = devices.filter(d => d.protocols.includes('http'));

  const config = telegrafTemplate({
    region,
    generatedAt: new Date().toISOString(),
    pingTargets,
    snmpDevices,
    gnmiDevices,
    httpDevices
  });

  reply.header('Content-Type', 'text/plain');
  return config;
});

// List available regions
fastify.get('/api/regions', async () => {
  const regions = new Set(
    Array.from(deviceInventory.values()).map(d => d.region)
  );
  return Array.from(regions);
});
// GET /api/topology - Return full dependency graph
fastify.get('/api/topology', async () => {
  const nodes = Array.from(deviceInventory.values()).map(d => ({
    id: d.id,
    label: d.name,
    type: d.type,
    data: d
  }));

  const edges: { source: string; target: string }[] = [];
  for (const device of deviceInventory.values()) {
    if (device.dependsOn) {
      for (const depId of device.dependsOn) {
        edges.push({ source: device.id, target: depId });
      }
    }
  }

  return { nodes, edges };
});

// GET /api/topology/impact/:nodeId - Return nodes affected by a failure of :nodeId
fastify.get('/api/topology/impact/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  if (!deviceInventory.has(id)) {
    return reply.status(404).send({ error: 'Node not found' });
  }

  const affectedNodes = new Set<string>();
  const queue = [id];

  const visit = (nodeId: string) => {
    for (const device of deviceInventory.values()) {
      if (device.dependsOn?.includes(nodeId) && !affectedNodes.has(device.id)) {
        affectedNodes.add(device.id);
        queue.push(device.id);
      }
    }
  };

  while (queue.length > 0) {
    const current = queue.shift()!;
    visit(current);
  }

  return {
    rootCause: id,
    affectedIds: Array.from(affectedNodes),
    affectedNodes: Array.from(affectedNodes).map(aid => deviceInventory.get(aid))
  };
});


const start = async () => {
  try {
    await fastify.listen({ port: 3003, host: '0.0.0.0' });
    logger.info('Config Manager running on port 3003');
  } catch (err: any) {
    logger.error(err.message);
    process.exit(1);
  }
};

start();
