import { describe, expect, it } from 'vitest'

import { httpHostname } from './page-host'

describe('httpHostname', () => {
    it('returns the hostname of http and https URLs', () => {
        expect(httpHostname('https://www.example.com:8443/a?b')).toBe('www.example.com')
        expect(httpHostname('http://localhost:5173/')).toBe('localhost')
    })

    it('rejects other schemes, junk and missing URLs', () => {
        expect(httpHostname('chrome://extensions')).toBeNull()
        expect(httpHostname('file:///Users/me/a.html')).toBeNull()
        expect(httpHostname('https-not-a-url')).toBeNull()
        expect(httpHostname(undefined)).toBeNull()
    })
})
