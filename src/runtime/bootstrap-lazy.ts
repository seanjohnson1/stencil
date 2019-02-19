import * as d from '@declarations';
import { BUILD } from '@build-conditionals';
import { componentOnReady } from './component-on-ready';
import { connectedCallback } from './connected-callback';
import { disconnectedCallback } from './disconnected-callback';
import { doc, getHostRef, registerHost, supportsShadowDom } from '@platform';
import { postUpdateComponent, scheduleUpdate } from './update-component';
import { proxyComponent } from './proxy-component';
import { CMP_FLAG } from '@utils';


export const bootstrapLazy = (lazyBundles: d.LazyBundlesRuntimeData) => {
  // bootstrapLazy

  const cmpTags: string[] = [];

  lazyBundles.forEach(lazyBundle =>

    lazyBundle[1].forEach(cmpLazyMeta => {

      cmpLazyMeta.lazyBundleIds = lazyBundle[0];

      if (!customElements.get(cmpLazyMeta.cmpTag)) {
        if (BUILD.style) {
          cmpTags.push(cmpLazyMeta.cmpTag);
        }
        customElements.define(
          cmpLazyMeta.cmpTag,
          class extends HTMLElement {
            // StencilLazyHost
            constructor() {
              super();
              registerHost(this);
              if (BUILD.shadowDom && supportsShadowDom && cmpLazyMeta.cmpFlags & CMP_FLAG.shadowDomEncapsulation) {
                // DOM WRITE
                // this component is using shadow dom
                // and this browser supports shadow dom
                // add the read-only property "shadowRoot" to the host element
                this.attachShadow({ 'mode': 'open' });
              }
            }

            connectedCallback() {
              connectedCallback(this, cmpLazyMeta);
            }

            disconnectedCallback() {
              if (BUILD.cmpDidUnload) {
                disconnectedCallback(this);
              }
            }

            's-init'() {
              const hostRef = getHostRef(this);
              if (hostRef.lazyInstance) {
                postUpdateComponent(this, hostRef);
              }
            }

            forceUpdate() {
              if (BUILD.updatable) {
                const hostRef = getHostRef(this);
                scheduleUpdate(
                  this,
                  hostRef,
                  cmpLazyMeta,
                  false
                );
              }
            }

            componentOnReady(): any {
              return componentOnReady(getHostRef(this));
            }

            static get observedAttributes() {
              return proxyComponent(this as any, cmpLazyMeta, 1, 0);
            }
          } as any
        );
      }
    })

  );

  if (BUILD.style) {
    const visibilityStyle = doc.createElement('style');
    visibilityStyle.innerHTML = cmpTags + '{visibility:hidden}.hydrated{visibility:inherit}';
    visibilityStyle.setAttribute('data-styles', '');

    const y = doc.head.querySelector('meta[charset]');
    doc.head.insertBefore(visibilityStyle, y ? y.nextSibling : doc.head.firstChild);
  }
};