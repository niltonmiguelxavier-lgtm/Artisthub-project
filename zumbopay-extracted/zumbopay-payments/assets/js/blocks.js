/* global wc, wp */
(function () {
  const { registerPaymentMethod } = window.wc.wcBlocksRegistry;
  const { getSetting } = window.wc.wcSettings;
  const { createElement: h, useState, useEffect } = window.wp.element;
  const { decodeEntities } = window.wp.htmlEntities;

  const data = getSetting('zumbopay_data', {});
  const title = decodeEntities(data.title || 'ZumboPay');
  const brandLogo = data.brand_logo || data.icon || '';

  // Label with ZumboPay logo
  const Label = () => h('span', {
    style: { display: 'inline-flex', alignItems: 'center', gap: 8 }
  }, [
    brandLogo ? h('img', {
      key: 'i', src: brandLogo, alt: 'ZumboPay',
      style: { height: 22, width: 'auto', objectFit: 'contain' }
    }) : null,
    h('span', { key: 't', style: { fontWeight: 600 } }, title),
  ]);

  const Content = (props) => {
    const methods = (data.methods || []).filter((m) =>
      (m.currencies || []).includes(data.currency)
    );
    const [method, setMethod] = useState(methods.length === 1 ? methods[0].key : '');
    const [phone, setPhone] = useState('');
    const [recurring, setRecurring] = useState(false);
    const [interval, setInterval] = useState('monthly');
    const [mandate, setMandate] = useState(false);

    const selected = methods.find((m) => m.key === method) || null;
    const isEmola = selected && selected.key === 'emola';

    const { eventRegistration, emitResponse } = props;
    const { onPaymentSetup } = eventRegistration;

    useEffect(() => {
      const unsub = onPaymentSetup(async () => {
        if (!method || !selected) {
          return {
            type: emitResponse.responseTypes.ERROR,
            message: 'Escolha um método de pagamento.',
          };
        }
        if (selected.needs_phone && !/^\d{9}$/.test(phone)) {
          return {
            type: emitResponse.responseTypes.ERROR,
            message: 'Introduza um número de telefone válido (9 dígitos).',
          };
        }
        if (recurring && !mandate) {
          return {
            type: emitResponse.responseTypes.ERROR,
            message: 'Deve aceitar o mandato de cobrança recorrente.',
          };
        }
        return {
          type: emitResponse.responseTypes.SUCCESS,
          meta: {
            paymentMethodData: {
              zumbopay_method: method,
              zumbopay_phone: phone,
              zumbopay_recurring: recurring ? '1' : '',
              zumbopay_interval: interval,
              zumbopay_mandate: mandate ? '1' : '',
            },
          },
        };
      });
      return unsub;
    }, [method, phone, recurring, interval, mandate, selected]);

    return h('div', { style: { display: 'grid', gap: 10, paddingTop: 4 } }, [
      brandLogo && h('div', {
        key: 'brand',
        style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }
      }, [
        h('img', { key: 'i', src: brandLogo, alt: 'ZumboPay', style: { height: 20 } }),
        h('small', { key: 't', style: { color: '#64748b', fontSize: 11 } },
          'Pagamento seguro via ZumboPay'),
      ]),

      h('div', {
        key: 'g',
        style: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(methods.length,3) || 1},1fr)`, gap: 8 }
      },
        methods.map((m) => {
          const on = method === m.key;
          return h('label', {
            key: m.key,
            style: {
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              padding: '12px 6px', minHeight: 78,
              border: on ? '2px solid #f97316' : '1px solid #e5e7eb',
              borderRadius: 10, background: on ? '#fff7ed' : '#fff',
              cursor: 'pointer', textAlign: 'center',
              boxShadow: on ? '0 2px 8px rgba(249,115,22,.18)' : 'none',
              transition: 'all .15s ease',
            }
          }, [
            h('input', {
              key: 'r', type: 'radio', name: 'zumbopay_method', value: m.key,
              checked: on, onChange: () => setMethod(m.key),
              style: { position: 'absolute', opacity: 0, pointerEvents: 'none' },
            }),
            m.logo_url ? h('img', {
              key: 'img', src: m.logo_url, alt: m.label,
              style: { height: 28, maxWidth: '80%', objectFit: 'contain' }
            }) : null,
            h('span', {
              key: 'l',
              style: { fontWeight: 600, fontSize: 11, color: '#334155', lineHeight: 1.1 }
            }, m.label),
          ]);
        })
      ),

      selected && selected.needs_phone && h('input', {
        key: 'p', type: 'tel', maxLength: 9,
        placeholder: 'Telefone (9 dígitos)',
        value: phone,
        onChange: (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9)),
        style: {
          padding: 10, border: '1px solid #e5e7eb',
          borderRadius: 8, width: '100%', fontSize: 14
        },
      }),

      isEmola && h('div', {
        key: 'emola',
        style: {
          padding: '8px 10px', borderRadius: 8,
          background: '#fff7ed', border: '1px solid #fed7aa',
          color: '#9a3412', fontSize: 12, lineHeight: 1.35,
        }
      }, '🔒 Para e-Mola: a sua encomenda só é confirmada depois de introduzir o PIN no seu telemóvel. Não feche esta página enquanto não receber o pedido e confirmar com o PIN.'),

      (selected && selected.recurring && data.recurring_enabled) && h('div', {
        key: 'rec',
        style: {
          padding: 10, border: '1px dashed #cbd5e1',
          borderRadius: 10, background: '#f8fafc'
        }
      }, [
        h('label', { key: 'e', style: { display: 'flex', alignItems: 'center', gap: 6 } }, [
          h('input', {
            type: 'checkbox', checked: recurring,
            onChange: (e) => setRecurring(e.target.checked)
          }),
          h('strong', {}, 'Pagamento recorrente'),
        ]),
        recurring && h('div', { key: 'i', style: { marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' } }, [
          h('label', { style: { minWidth: 100, fontSize: 13 } }, 'Periodicidade:'),
          h('select', {
            value: interval,
            onChange: (e) => setInterval(e.target.value),
            style: { padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, flex: 1 }
          },
            Object.entries(data.intervals || {}).map(([v, l]) =>
              h('option', { key: v, value: v }, l))),
        ]),
        recurring && h('label', {
          key: 'm',
          style: { display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8, fontSize: 12, color: '#334155' }
        }, [
          h('input', {
            type: 'checkbox', checked: mandate,
            onChange: (e) => setMandate(e.target.checked)
          }),
          h('span', {}, [
            'Aceito o mandato de cobrança recorrente',
            data.terms_url ? h('a', {
              key: 't', href: data.terms_url, target: '_blank', rel: 'noopener',
              style: { marginLeft: 4 }
            }, '(Termos)') : null,
          ]),
        ]),
      ]),
    ]);
  };

  registerPaymentMethod({
    name: 'zumbopay',
    label: h(Label),
    ariaLabel: title,
    content: h(Content),
    edit: h(Content),
    canMakePayment: () => true,
    supports: { features: ['products'] },
  });
})();
