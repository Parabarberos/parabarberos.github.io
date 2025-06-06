
// index.tsx
interface Product {
  id: string;
  name: string;
  description: string;
}
interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
  available?: boolean;
}
interface TransferRequest {
  id: string;
  items: TransferItem[];
  fromWarehouse: string;
  toWarehouse: string;
  requesterName: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  timestamp: number;
  notes?: string;
}
const allProducts: Product[] = [
  { id: "P001", name: "Shampoo American Crew", description: "Limpieza diaria 250ml" },
  { id: "P002", name: "Cera Fiber", description: "Fijación media, acabado natural" },
  { id: "P003", name: "After Shave BLLNature", description: "Calmante post afeitado" },
];
let currentTransferItems: TransferItem[] = [];
let allTransferRequests: TransferRequest[] = JSON.parse(localStorage.getItem('transferRequests') || '[]');
let currentUserRole: 'requester' | 'admin' = (localStorage.getItem('userRole') as any) || 'requester';
const el = (id: string) => document.getElementById(id)!;
const productListDiv = el('productList');
const currentTransferRequestDiv = el('currentTransferRequest');
const transferForm = el('transferForm') as HTMLFormElement;
const fromWarehouse = el('fromWarehouse') as HTMLSelectElement;
const toWarehouse = el('toWarehouse') as HTMLSelectElement;
const requesterName = el('requesterName') as HTMLSelectElement;
const searchInput = el('searchInput') as HTMLInputElement;
const myPendingRequests = el('myPendingRequests');
const adminTransferRequests = el('adminTransferRequests');
const adminCompletedRequests = el('adminCompletedRequests');
const adminCancelledRequests = el('adminCancelledRequests');
const requesterSection = el('requesterSection');
const adminSection = el('adminSection');
const roleSelector = el('roleSelector') as HTMLSelectElement;

function save() {
  localStorage.setItem('transferRequests', JSON.stringify(allTransferRequests));
}
function renderProducts(filter = "") {
  productListDiv.innerHTML = '';
  allProducts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).forEach(product => {
    const div = document.createElement('div');
    div.className = 'border p-2 rounded shadow';
    div.innerHTML = \`
      <h4 class="font-semibold text-black">\${product.name}</h4>
      <p class="text-sm text-gray-500">\${product.description}</p>
      <input type="number" min="1" value="1" id="qty-\${product.id}" class="w-16 mt-1 border p-1 rounded" />
      <button data-id="\${product.id}" class="add-btn mt-2 bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded">Añadir</button>
    \`;
    productListDiv.appendChild(div);
  });
  document.querySelectorAll('.add-btn').forEach(btn => btn.addEventListener('click', handleAddProduct));
}
function handleAddProduct(e: any) {
  const id = e.target.dataset.id;
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  const qty = parseInt((document.getElementById(\`qty-\${id}\`) as HTMLInputElement).value);
  if (qty < 1) return;
  const existing = currentTransferItems.find(i => i.productId === id);
  if (existing) existing.quantity += qty;
  else currentTransferItems.push({ productId: id, productName: product.name, quantity: qty });
  renderCurrentTransfer();
}
function renderCurrentTransfer() {
  currentTransferRequestDiv.innerHTML = '';
  if (currentTransferItems.length === 0) {
    currentTransferRequestDiv.innerHTML = '<p class="text-gray-500 italic">No hay productos.</p>';
    return;
  }
  const ul = document.createElement('ul');
  currentTransferItems.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center';
    li.innerHTML = \`\${item.productName} (x\${item.quantity}) <button data-idx="\${idx}" class="remove-btn text-red-500">Quitar</button>\`;
    ul.appendChild(li);
  });
  currentTransferRequestDiv.appendChild(ul);
  document.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', handleRemoveProduct));
}
function handleRemoveProduct(e: any) {
  const idx = parseInt(e.target.dataset.idx);
  currentTransferItems.splice(idx, 1);
  renderCurrentTransfer();
}
function renderMyPendingRequests() {
  myPendingRequests.innerHTML = '';
  const name = requesterName.value;
  const myRequests = allTransferRequests.filter(r => r.requesterName === name && r.status === 'pending');
  myRequests.forEach(req => {
    const div = document.createElement('div');
    div.className = 'border p-2 rounded shadow bg-yellow-100';
    div.innerHTML = \`
      <p><strong>ID:</strong> \${req.id}</p>
      <ul class="ml-4 text-sm">\${req.items.map(i => \`<li>\${i.productName} (x\${i.quantity})</li>\`).join('')}</ul>
    \`;
    myPendingRequests.appendChild(div);
  });
}
function renderAdminRequests() {
  adminTransferRequests.innerHTML = '';
  adminCompletedRequests.innerHTML = '';
  adminCancelledRequests.innerHTML = '';
  allTransferRequests.forEach(req => {
    const div = document.createElement('div');
    div.className = 'border p-2 rounded shadow';
    div.innerHTML = \`
      <p><strong>ID:</strong> \${req.id}</p>
      <p class="text-sm">De: \${req.fromWarehouse} → A: \${req.toWarehouse}</p>
      <ul class="ml-4 text-sm">\${req.items.map((i, idx) => \`<li>\${i.productName} (x\${i.quantity})</li>\`).join('')}</ul>
      \${req.status === 'pending' ? \`
        <button class="bg-green-500 text-white px-2 py-1 rounded mt-2" onclick="completeRequest('\${req.id}')">Completar</button>
        <button class="bg-red-500 text-white px-2 py-1 rounded mt-2 ml-2" onclick="cancelRequest('\${req.id}')">Cancelar</button>\` : ''}
    \`;
    if (req.status === 'pending') adminTransferRequests.appendChild(div);
    else if (req.status === 'completed') adminCompletedRequests.appendChild(div);
    else if (req.status === 'cancelled') adminCancelledRequests.appendChild(div);
  });
}
function completeRequest(id: string) {
  const req = allTransferRequests.find(r => r.id === id);
  if (req) req.status = 'completed';
  save();
  renderAdminRequests();
}
function cancelRequest(id: string) {
  const req = allTransferRequests.find(r => r.id === id);
  if (req) req.status = 'cancelled';
  save();
  renderAdminRequests();
}
function handleSubmitTransfer(e: Event) {
  e.preventDefault();
  if (currentTransferItems.length === 0) return alert("Agrega productos primero.");
  const req: TransferRequest = {
    id: \`REQ-\${Date.now()}\`,
    items: JSON.parse(JSON.stringify(currentTransferItems)),
    fromWarehouse: fromWarehouse.value,
    toWarehouse: toWarehouse.value,
    requesterName: requesterName.value,
    status: 'pending',
    timestamp: Date.now(),
  };
  allTransferRequests.push(req);
  currentTransferItems = [];
  save();
  renderCurrentTransfer();
  renderMyPendingRequests();
  alert("Solicitud enviada");
}
function updateRoleView() {
  localStorage.setItem('userRole', currentUserRole);
  if (currentUserRole === 'requester') {
    requesterSection.classList.remove('hidden');
    adminSection.classList.add('hidden');
    renderMyPendingRequests();
  } else {
    requesterSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    renderAdminRequests();
  }
  roleSelector.value = currentUserRole;
}
searchInput.addEventListener('input', () => renderProducts(searchInput.value));
transferForm.addEventListener('submit', handleSubmitTransfer);
roleSelector.addEventListener('change', () => {
  currentUserRole = roleSelector.value as 'requester' | 'admin';
  updateRoleView();
});
renderProducts();
renderCurrentTransfer();
updateRoleView();
