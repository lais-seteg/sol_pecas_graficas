// ==================== CONFIGURAÇÃO SUPABASE ====================
const SUPABASE_URL = 'https://melphsmbvknfcfqtnymo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aZDIn8B_gjv-x-IyWL8loQ_2Naml9ce';

// Variáveis globais
var appSupabase = null;
var requests = [];
var currentUser = null;
var loginType = null;
var formAberto = true;

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistema);
} else {
    inicializarSistema();
}

function inicializarSistema() {
    console.log('🚀 Sistema iniciando...');
    
    if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'COLE_SUA_CHAVE_AQUI') {
        try {
            if (typeof window.supabase !== 'undefined') {
                appSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase conectado');
            } else {
                console.error('❌ Biblioteca Supabase não carregada');
            }
        } catch (error) {
            console.error('❌ Erro Supabase:', error);
        }
    }
    
    document.body.classList.add('theme-dark');
    
    var logo = document.getElementById('headerLogo');
    if (logo) logo.src = 'images/logo-branco.png';
    
    if (appSupabase) {
        carregarSolicitacoes();
    } else {
        requests = [];
        renderizarTabela();
        atualizarMetricas();
    }
    
    console.log('✅ Sistema pronto!');
}

// ==================== FUNÇÕES DE INTERFACE ====================

function toggleFormulario() {
    var formContent = document.getElementById('formContent');
    var toggleBtn = document.getElementById('toggleBtn');
    var toggleBtnText = document.getElementById('toggleBtnText');
    
    if (!formContent || !toggleBtn || !toggleBtnText) return;
    
    formAberto = !formAberto;
    
    if (formAberto) {
        formContent.classList.add('expanded');
        toggleBtn.classList.add('rotated');
        toggleBtnText.textContent = 'Recolher Formulário';
    } else {
        formContent.classList.remove('expanded');
        toggleBtn.classList.remove('rotated');
        toggleBtnText.textContent = 'Abrir Formulário';
    }
}

function abrirLogin(tipo) {
    loginType = tipo;
    var titleText = document.getElementById('loginTitleText');
    if (titleText) titleText.textContent = tipo === 'gestor' ? 'Acesso de Gestor' : 'Acesso Técnico';
    
    var modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('show');
        setTimeout(function() {
            var input = document.getElementById('accessCode');
            if (input) input.focus();
        }, 100);
    }
}

function fecharModalLogin() {
    var modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('show');
    
    var input = document.getElementById('accessCode');
    var errorEl = document.getElementById('loginError');
    
    if (input) {
        input.value = '';
        input.type = 'password';
    }
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.classList.remove('show');
    }
    
    var icon = document.getElementById('passwordToggleIcon');
    if (icon) icon.className = 'fas fa-eye';
}

function mostrarSenha() {
    var input = document.getElementById('accessCode');
    var icon = document.getElementById('passwordToggleIcon');
    
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function fazerLogin() {
    var codeInput = document.getElementById('accessCode');
    var errorEl = document.getElementById('loginError');
    
    if (!codeInput || !errorEl) return;
    
    var codigo = codeInput.value.trim();
    
    if (codigo === 'Arte@!970sol') {
        currentUser = { 
            type: loginType, 
            name: loginType === 'gestor' ? 'Gestor' : 'Técnico' 
        };
        
        fecharModalLogin();
        atualizarHeader();
        
        if (loginType === 'gestor') {
            var formSection = document.getElementById('formSection');
            if (formSection) formSection.style.display = 'none';
        }
        
        if (appSupabase) renderizarTabela();
        
        mostrarNotificacaoLogin('Login como ' + currentUser.name + '!', 'login-success');
    } else {
        errorEl.textContent = 'Código inválido!';
        errorEl.style.display = 'block';
        errorEl.classList.add('show');
        codeInput.value = '';
        codeInput.focus();
    }
}

function atualizarHeader() {
    if (!currentUser) return;
    
    var headerActions = document.getElementById('headerActions');
    if (headerActions) {
        headerActions.innerHTML = 
            '<div class="user-indicator"><i class="fas fa-check-circle"></i> <span>' + currentUser.name + '</span></div>' +
            '<button class="btn btn-outline" onclick="fazerLogout()" style="padding: 8px 16px; font-size: 0.85rem;"><i class="fas fa-sign-out-alt"></i> Sair</button>';
    }
}

function fazerLogout() {
    currentUser = null;
    var formSection = document.getElementById('formSection');
    if (formSection) formSection.style.display = 'block';
    location.reload();
    setTimeout(function() { mostrarNotificacaoLogin('Logout!', 'logout-info'); }, 500);
}

function mostrarToast(mensagem, tipo) {
    if (!tipo) tipo = 'success';
    var existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    var toast = document.createElement('div');
    toast.className = 'toast-notification ' + tipo;
    var icons = { success: 'fa-check-circle', info: 'fa-info-circle', error: 'fa-exclamation-circle' };
    toast.innerHTML = '<i class="fas ' + (icons[tipo] || icons.info) + '"></i> <span>' + mensagem + '</span>';
    document.body.appendChild(toast);
    
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 400);
    }, 3000);
}

function mostrarNotificacaoLogin(mensagem, tipo) {
    var existing = document.querySelector('.login-status-indicator');
    if (existing) existing.remove();
    
    var indicator = document.createElement('div');
    indicator.className = 'login-status-indicator ' + tipo;
    var icons = { 'login-success': 'fa-sign-in-alt', 'logout-info': 'fa-sign-out-alt' };
    indicator.innerHTML = '<i class="fas ' + icons[tipo] + '"></i> <span>' + mensagem + '</span>';
    document.body.appendChild(indicator);
    
    setTimeout(function() { indicator.classList.add('show'); }, 10);
    setTimeout(function() {
        indicator.classList.remove('show');
        setTimeout(function() { indicator.remove(); }, 500);
    }, 2500);
}

// ==================== CAMPOS DO FORMULÁRIO ====================

function mostrarCampoUrgencia(mostrar) {
    var field = document.getElementById('urgencyField');
    if (!field) return;
    var textarea = field.querySelector('textarea');
    if (mostrar) { 
        field.classList.add('show'); 
        if (textarea) textarea.required = true; 
    } else { 
        field.classList.remove('show'); 
        if (textarea) textarea.required = false; 
    }
}

function verificarOutroTipo() {
    var select = document.getElementById('tipoMaterial');
    var field = document.getElementById('outroTipoField');
    if (!select || !field) return;
    var input = field.querySelector('input');
    
    if (select.value === 'outro') { 
        field.classList.add('show'); 
        if (input) input.required = true; 
    } else { 
        field.classList.remove('show'); 
        if (input) input.required = false; 
    }
}

function mostrarCampoIdentidade(mostrar) {
    var field = document.getElementById('identityField');
    if (!field) return;
    if (mostrar) field.classList.add('show'); 
    else field.classList.remove('show');
}

function toggleOutrosFormato() {
    var field = document.getElementById('outrosFormatoField');
    if (!field) return;
    var input = field.querySelector('input');
    
    var checkboxOutros = document.querySelector('input[name="formato[]"][value="outros"]');
    
    if (checkboxOutros && checkboxOutros.checked) { 
        field.classList.add('show'); 
        if (input) input.required = true; 
    } else { 
        field.classList.remove('show'); 
        if (input) {
            input.required = false;
            input.value = '';
        }
    }
}

function limparFormulario() {
    var form = document.getElementById('requestForm');
    if (form) form.reset();
    document.getElementById('successMessage').classList.remove('show');
    document.getElementById('urgencyField').classList.remove('show');
    document.getElementById('outroTipoField').classList.remove('show');
    document.getElementById('identityField').classList.remove('show');
    document.getElementById('outrosFormatoField').classList.remove('show');
}

// ==================== CRUD COM SUPABASE ====================

async function salvarSolicitacao(event) {
    event.preventDefault();
    if (!appSupabase) {
        mostrarToast('⚠️ Supabase não configurado', 'error');
        return;
    }
    
    var formData = new FormData(event.target);
    var formatos = [];
    formData.getAll('formato[]').forEach(function(v) { formatos.push(v); });
    
    var dados = {
        solicitante_nome: formData.get('solicitante_nome'),
        solicitante_setor: formData.get('solicitante_setor'),
        solicitante_email: formData.get('solicitante_email'),
        solicitante_cliente: formData.get('solicitante_cliente'),
        prazo_ideal: formData.get('prazo_ideal'),
        prazo_limite: formData.get('prazo_limite'),
        urgente: formData.get('urgente') === 'sim',
        urgencia_justificativa: formData.get('urgencia_justificativa'),
        tipo_material: formData.get('tipo_material'),
        tipo_material_outro: formData.get('tipo_material_outro'),
        objetivo: formData.get('objetivo'),
        conteudo: formData.get('conteudo'),
        info_obrigatorias: formData.get('info_obrigatorias'),
        formatos: formatos,
        formato_outros: formData.get('formato_outros'),
        dimensoes: formData.get('dimensoes'),
        paginas: formData.get('paginas') ? parseInt(formData.get('paginas')) : null,
        identidade_visual: formData.get('identidade_visual') === 'sim',
        identidade_diretorio: formData.get('identidade_diretorio'),
        referencias_diretorio: formData.get('referencias_diretorio'),
        arte_anterior: formData.get('arte_anterior') === 'sim',
        arte_anterior_diretorio: formData.get('arte_anterior_diretorio'),
        materiais_diretorio: formData.get('materiais_diretorio'),
        observacoes: formData.get('observacoes'),
        status: 'na_fila',
        criado_por: currentUser ? currentUser.name : 'sistema'
    };

    try {
        var result = await appSupabase.from('solicitacoes').insert([dados]).select();
        if (result.error) throw result.error;

        document.getElementById('protocolNumber').textContent = result.data[0].protocolo;
        document.getElementById('successMessage').classList.add('show');
        
        await carregarSolicitacoes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setTimeout(function() {
            document.getElementById('successMessage').classList.remove('show');
            limparFormulario();
            toggleFormulario();
        }, 3000);
        
        mostrarToast('Salvo com sucesso!', 'success');
        
    } catch (err) {
        console.error('❌ Erro:', err);
        mostrarToast('Erro: ' + err.message, 'error');
    }
}

async function carregarSolicitacoes() {
    if (!appSupabase) return;
    try {
        var result = await appSupabase.from('solicitacoes').select('*').order('criado_em', { ascending: false });
        if (result.error) throw result.error;

        requests = (result.data || []).map(function(item) {
            return {
                id: item.protocolo,
                uuid: item.id,
                solicitante: item.solicitante_nome,
                tipo: item.tipo_material_outro || item.tipo_material,
                cliente: item.solicitante_cliente,
                status: item.status,
                data: new Date(item.criado_em).toLocaleDateString('pt-BR'),
                detalhes: {
                    setor: item.solicitante_setor,
                    email: item.solicitante_email,
                    cliente: item.solicitante_cliente,
                    prazo_ideal: item.prazo_ideal,
                    prazo_limite: item.prazo_limite,
                    urgente: item.urgente ? 'sim' : 'nao',
                    justificativa_urgencia: item.urgencia_justificativa,
                    objetivo: item.objetivo,
                    conteudo: item.conteudo,
                    info_obrigatorias: item.info_obrigatorias,
                    formatos: item.formatos ? item.formatos.join(', ') : '',
                    formato_outros: item.formato_outros,
                    dimensoes: item.dimensoes,
                    paginas: item.paginas,
                    identidade_visual: item.identidade_visual ? 'sim' : 'nao',
                    identidade_diretorio: item.identidade_diretorio,
                    referencias_diretorio: item.referencias_diretorio,
                    arte_anterior: item.arte_anterior ? 'sim' : 'nao',
                    arte_anterior_diretorio: item.arte_anterior_diretorio,
                    materiais_diretorio: item.materiais_diretorio,
                    observacoes: item.observacoes
                }
            };
        });

        renderizarTabela();
        atualizarMetricas();
        
    } catch (err) {
        console.error('❌ Erro ao carregar:', err);
    }
}

// ==================== TABELA E AÇÕES ====================

function renderizarTabela(filtro) {
    if (!filtro) filtro = 'todos';
    var tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;
    
    var filtrados = requests;
    if (filtro !== 'todos') {
        filtrados = requests.filter(function(r) { return r.status === filtro; });
    }
    
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state" style="text-align: center; padding: 40px;"><i class="fas fa-inbox" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 10px; display: block;"></i><p style="color: var(--text-muted);">Nenhuma solicitação encontrada</p></td></tr>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < filtrados.length; i++) {
        var r = filtrados[i];
        var d = r.detalhes;
        
        var prazoDisplay = '-';
        if (d.prazo_ideal) {
            prazoDisplay = new Date(d.prazo_ideal).toLocaleDateString('pt-BR');
            if (d.urgente === 'sim') {
                prazoDisplay = '<span style="color: var(--danger); font-weight: 600;"><i class="fas fa-exclamation-circle"></i> ' + prazoDisplay + '</span>';
            }
        }
        
        var tipoDisplay = r.tipo === 'outro' && d.tipo_material_outro ? d.tipo_material_outro : r.tipo;
        
        var formatoDisplay = '';
        if (d.formatos && d.formatos.length > 0) {
            var arr = d.formatos.split(', ');
            if (arr.length <= 2) {
                for (var j = 0; j < arr.length; j++) {
                    var f = arr[j];
                    formatoDisplay += '<span class="format-tag">' + f.charAt(0).toUpperCase() + f.slice(1) + '</span>';
                }
            } else {
                formatoDisplay = '<span class="format-tag">' + arr.length + ' formatos</span>';
            }
        }
        
        if (d.formato_outros) {
            formatoDisplay += '<span class="format-tag" style="background: var(--warning); color: #000;">' + d.formato_outros + '</span>';
        }
        
        if (!formatoDisplay) formatoDisplay = '-';
        
        var statusHtml = '';
        if (currentUser && currentUser.type === 'gestor') {
            statusHtml = '<select class="status-select" onchange="mudarStatus(\'' + r.id + '\', this.value)">' +
                '<option value="na_fila" ' + (r.status === 'na_fila' ? 'selected' : '') + '>Na Fila</option>' +
                '<option value="em_andamento" ' + (r.status === 'em_andamento' ? 'selected' : '') + '>Processando</option>' +
                '<option value="ajustes" ' + (r.status === 'ajustes' ? 'selected' : '') + '>Aguardando Dados</option>' +
                '<option value="concluido" ' + (r.status === 'concluido' ? 'selected' : '') + '>Finalizado</option>' +
                '</select>';
        } else {
            statusHtml = '<span class="status-badge status-' + r.status + '">' + formatarStatus(r.status) + '</span>';
        }
        
        var acoesHtml = '<button class="action-btn view" onclick="verSolicitacao(\'' + r.id + '\')"><i class="fas fa-eye"></i> Ver</button>';
        if (currentUser && currentUser.type === 'gestor') {
            acoesHtml += '<button class="action-btn delete" onclick="excluirSolicitacao(\'' + r.id + '\')" style="margin-left: 6px;"><i class="fas fa-trash"></i></button>';
        }
        
        html += '<tr>' +
            '<td><strong style="color: var(--primary); font-family: monospace;">' + r.id + '</strong></td>' +
            '<td>' + r.solicitante + '</td>' +
            '<td>' + (d.setor || '-') + '</td>' +
            '<td>' + tipoDisplay + '</td>' +
            '<td>' + formatoDisplay + '</td>' +
            '<td>' + prazoDisplay + '</td>' +
            '<td style="text-align: center;">' + statusHtml + '</td>' +
            '<td style="text-align: center;">' + acoesHtml + '</td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

function filtrarTabela(filtro, event) {
    renderizarTabela(filtro);
    var buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(function(btn) { btn.classList.remove('active'); });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function atualizarMetricas() {
    var totalEl = document.getElementById('totalRequests');
    var naFilaEl = document.getElementById('naFilaRequests');
    var processandoEl = document.getElementById('processandoRequests');
    var finalizadasEl = document.getElementById('finalizadasRequests');
    
    if (totalEl) totalEl.textContent = requests.length;
    if (naFilaEl) naFilaEl.textContent = requests.filter(function(r) { return r.status === 'na_fila'; }).length;
    if (processandoEl) processandoEl.textContent = requests.filter(function(r) { return r.status === 'em_andamento'; }).length;
    if (finalizadasEl) finalizadasEl.textContent = requests.filter(function(r) { return r.status === 'concluido'; }).length;
}

function formatarStatus(status) {
    var map = { 'na_fila': 'Na Fila', 'em_andamento': 'Processando', 'ajustes': 'Aguardando Dados', 'concluido': 'Finalizado' };
    return map[status] || status;
}

async function mudarStatus(protocolo, novoStatus) {
    if (!appSupabase) {
        mostrarToast('⚠️ Supabase não configurado', 'error');
        return;
    }
    var solicitacao = requests.find(function(r) { return r.id === protocolo; });
    if (!solicitacao || !solicitacao.uuid) return;

    try {
        await appSupabase.from('solicitacoes').update({ status: novoStatus, atualizado_em: new Date().toISOString() }).eq('id', solicitacao.uuid);
        mostrarToast('Status atualizado!', 'success');
        await carregarSolicitacoes();
    } catch (err) {
        mostrarToast('Erro ao atualizar', 'error');
    }
}

async function excluirSolicitacao(protocolo) {
    if (!confirm('⚠️ Tem certeza que deseja excluir a solicitação ' + protocolo + '?')) return;
    
    var solicitacao = requests.find(function(r) { return r.id === protocolo; });
    if (!solicitacao || !solicitacao.uuid) return;

    try {
        await appSupabase.from('solicitacoes').delete().eq('id', solicitacao.uuid);
        mostrarToast('Solicitação excluída!', 'success');
        await carregarSolicitacoes();
    } catch (err) {
        mostrarToast('Erro ao excluir', 'error');
    }
}

// ==================== MODAL DE VISUALIZAÇÃO ====================

function verSolicitacao(id) {
    var request = requests.find(function(r) { return r.id === id; });
    if (!request) return;
    
    var modalBody = document.getElementById('viewModalBody');
    var d = request.detalhes;
    
    var html = '<div style="display: grid; gap: 20px;">';
    
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(30,41,59,0.5) 100%); padding: 25px; border-radius: 12px; border: 1px solid var(--border);">' +
        '<div><strong style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Protocolo</strong><br><span style="font-size: 1.4rem; font-weight: 700; color: var(--primary);">' + request.id + '</span></div>' +
        '<div><strong style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Status</strong><br><span class="status-badge status-' + request.status + '" style="font-size: 0.95rem; padding: 10px 18px;">' + formatarStatus(request.status) + '</span></div>' +
        '<div><strong style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Data</strong><br><span style="font-size: 1.1rem; font-weight: 600;">' + request.data + '</span></div></div>';
    
    html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">' +
        '<div class="block-header"><i class="fas fa-user"></i><h3>1. Solicitante</h3></div>' +
        '<div class="block-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">' +
        '<div><strong>Nome:</strong><br>' + request.solicitante + '</div>' +
        '<div><strong>Setor:</strong><br>' + (d.setor || '-') + '</div>' +
        '<div><strong>E-mail:</strong><br><a href="mailto:' + d.email + '" style="color: var(--accent-blue);">' + d.email + '</a></div>' +
        '<div><strong>Cliente:</strong><br>' + (d.cliente || '-') + '</div></div></div>';
    
    html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">' +
        '<div class="block-header"><i class="fas fa-calendar-alt"></i><h3>2. Prazo</h3></div>' +
        '<div class="block-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">' +
        '<div><strong>Ideal:</strong><br>' + (d.prazo_ideal ? new Date(d.prazo_ideal).toLocaleDateString('pt-BR') : '-') + '</div>' +
        '<div><strong>Limite:</strong><br>' + (d.prazo_limite ? new Date(d.prazo_limite).toLocaleDateString('pt-BR') : '-') + '</div></div>' +
        (d.urgente === 'sim' ? '<div style="background: rgba(251,191,36,0.15); padding: 15px; border-radius: 8px; border: 1px solid var(--accent-yellow); margin-top: 15px;"><p style="color: var(--accent-yellow); font-weight: 700;"><i class="fas fa-exclamation-triangle"></i> URGENTE</p><p style="margin-top:5px">' + (d.justificativa_urgencia || 'Sem justificativa') + '</p></div>' : '') + '</div>';
    
    html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">' +
        '<div class="block-header"><i class="fas fa-shapes"></i><h3>3. Tipo</h3></div>' +
        '<div class="block-content"><p><strong>Tipo:</strong> <span style="background: var(--bg-input); padding: 5px 12px; border-radius: 6px;">' + (d.tipo_material_outro || request.tipo) + '</span></p></div></div>';
    
    html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">' +
        '<div class="block-header"><i class="fas fa-bullseye"></i><h3>4. Objetivo</h3></div>' +
        '<div class="block-content"><p style="background: var(--bg-input); padding: 15px; border-radius: 8px;">' + d.objetivo + '</p></div></div>';
    
    html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">' +
        '<div class="block-header"><i class="fas fa-file-word"></i><h3>5. Conteúdo</h3></div>' +
        '<div class="block-content"><p style="background: var(--bg-input); padding: 15px; border-radius: 8px; white-space: pre-wrap;">' + d.conteudo + '</p></div></div>';
    
    html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">' +
        '<div class="block-header"><i class="fas fa-exclamation-circle"></i><h3>6. Obrigatórias</h3></div>' +
        '<div class="block-content"><p style="background: var(--bg-input); padding: 15px; border-radius: 8px;">' + d.info_obrigatorias + '</p></div></div>';
    
    html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">' +
        '<div class="block-header"><i class="fas fa-expand"></i><h3>7. Formato</h3></div>' +
        '<div class="block-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;"><div><strong>Canais:</strong><br>';
    if (d.formatos) {
        d.formatos.split(', ').forEach(function(f) {
            html += '<span class="format-tag" style="margin: 3px;">' + f.charAt(0).toUpperCase() + f.slice(1) + '</span>';
        });
    } else {
        html += '-';
    }
    if (d.formato_outros) {
        html += '<br><span class="format-tag" style="background: var(--warning); color: #000; margin-top: 5px;">' + d.formato_outros + '</span>';
    }
    html += '</div>';
    if (d.dimensoes) html += '<div><strong>Dimensões:</strong><br>' + d.dimensoes + '</div>';
    if (d.paginas) html += '<div><strong>Páginas:</strong><br>' + d.paginas + '</div>';
    html += '</div></div>';
    
    if (d.identidade_visual === 'sim') {
        html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;"><div class="block-header"><i class="fas fa-palette"></i><h3>8. Identidade</h3></div><div class="block-content"><p style="color: var(--accent-green); margin-bottom: 10px;"><i class="fas fa-check-circle"></i> Possui</p>' + (d.identidade_diretorio ? '<code style="background: var(--bg-input); padding: 10px; border-radius: 6px; display: block; word-break: break-all;">' + d.identidade_diretorio + '</code>' : '') + '</div></div>';
    }

    if (d.referencias_diretorio) {
        html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;"><div class="block-header"><i class="fas fa-images"></i><h3>9. Referências</h3></div><div class="block-content"><code style="background: var(--bg-input); padding: 10px; border-radius: 6px; display: block; word-break: break-all;">' + d.referencias_diretorio + '</code>' + (d.arte_anterior === 'sim' && d.arte_anterior_diretorio ? '<p style="margin-top: 10px;"><strong>Arte Anterior:</strong></p><code style="background: var(--bg-input); padding: 10px; border-radius: 6px; display: block; word-break: break-all;">' + d.arte_anterior_diretorio + '</code>' : '') + '</div></div>';
    }

    if (d.materiais_diretorio) {
        html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;"><div class="block-header"><i class="fas fa-folder-open"></i><h3>10. Materiais</h3></div><div class="block-content"><code style="background: var(--bg-input); padding: 10px; border-radius: 6px; display: block; word-break: break-all;">' + d.materiais_diretorio + '</code></div></div>';
    }

    if (d.observacoes) {
        html += '<div style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;"><div class="block-header"><i class="fas fa-sticky-note"></i><h3>11. Observações</h3></div><div class="block-content"><p style="background: var(--bg-input); padding: 15px; border-radius: 8px;">' + d.observacoes + '</p></div></div>';
    }

    html += '</div>';
    modalBody.innerHTML = html;
    
    var modal = document.getElementById('viewModal');
    if (modal) modal.classList.add('show');
}

function fecharModalVisualizacao() {
    var modal = document.getElementById('viewModal');
    if (modal) modal.classList.remove('show');
}

window.onclick = function(event) {
    var viewModal = document.getElementById('viewModal');
    var loginModal = document.getElementById('loginModal');
    if (event.target === viewModal) fecharModalVisualizacao();
    if (event.target === loginModal) fecharModalLogin();
};

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        var viewModal = document.getElementById('viewModal');
        var loginModal = document.getElementById('loginModal');
        if (viewModal && viewModal.classList.contains('show')) fecharModalVisualizacao();
        if (loginModal && loginModal.classList.contains('show')) fecharModalLogin();
    }
});