import { useEffect, useRef, useState } from 'react'
import { getGoogleMapsPlatformApiKey } from '../config/googleMapsPlatformKey'
import type { Store } from '../services/stores'

interface StoreLocatorMapProps {
  stores: Store[]
}

/**
 * Renders a Google Maps Locator Plus widget using the Extended Component Library.
 * Locations are built dynamically from the stores array.
 * Stores without an address are skipped.
 */
export function StoreLocatorMap({ stores }: StoreLocatorMapProps) {
  const apiKey = getGoogleMapsPlatformApiKey()
  const locatorRef = useRef<HTMLElement & { configureFromQuickBuilder: (config: unknown) => void }>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Inject the Extended Component Library script once
  useEffect(() => {
    const ECL_SRC =
      'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js'

    if (document.querySelector(`script[src="${ECL_SRC}"]`)) {
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.type = 'module'
    script.src = ECL_SRC
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Configure the locator once script is loaded and ref is ready
  useEffect(() => {
    if (!scriptLoaded || !locatorRef.current || !apiKey) return

    const locations = stores
      .filter((s) => s.address)
      .map((s) => ({
        title: s.name,
        address1: s.address as string,
        address2: '',
      }))

    const configuration = {
      locations,
      mapOptions: {
        center: { lat: 22.3569, lng: 91.7832 }, // Default: Chittagong
        fullscreenControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        zoom: 12,
        zoomControl: true,
        maxZoom: 17,
        mapId: '',
      },
      mapsApiKey: apiKey,
      capabilities: {
        input: true,
        autocomplete: true,
        directions: false,
        distanceMatrix: true,
        details: true,
        actions: false,
      },
    }

    // Wait for the custom element to be defined before configuring
    customElements.whenDefined('gmpx-store-locator').then(() => {
      locatorRef.current?.configureFromQuickBuilder(configuration)
    })
  }, [scriptLoaded, stores, apiKey])

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-gray-500">
          Google Maps API key is not configured. Set{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
            VITE_GOOGLE_MAPS_API_KEY_PLACES_API
          </code>{' '}
          in your <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.env.local</code>.
        </p>
      </div>
    )
  }

  const mappableStores = stores.filter((s) => s.address)

  if (mappableStores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-gray-500">
          No stores have addresses yet. Add an address to a store to see it on the map.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm" style={{ height: '520px' }}>
      {/* @ts-expect-error – gmpx-api-loader is a custom HTML element */}
      <gmpx-api-loader key={apiKey} solution-channel="GMP_QB_locatorplus_v11_c" />
      {/* @ts-expect-error – gmpx-store-locator is a custom HTML element */}
      <gmpx-store-locator ref={locatorRef} map-id="DEMO_MAP_ID" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
