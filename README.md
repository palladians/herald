<!-- markdownlint-disable -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<div align="center">
  <img src="apps/docs/static/img/herald.png" height="256">
</div>
<div align="center">
  <img src="apps/docs/static/img/Herald-name.png" height="128">
</div>
<div align="center">
<br />
<!-- markdownlint-restore -->

[![Project license](https://img.shields.io/github/license/palladians/palladians.svg?style=flat-square)](LICENSE)
[![Pull Requests welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](https://github.com/palladians/herald/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
<a href="https://twitter.com/palladians_xyz">
<img src="https://img.shields.io/twitter/follow/palladians_xyz?style=social"/>
</a> <a href="https://github.com/palladians/herald">
<img src="https://img.shields.io/github/stars/palladians/herald?style=social"/>
</a> <a href="https://palladians.github.io/herald/">
<img src="https://img.shields.io/badge/Documentation-Website-yellow"/> </a>

<a href="https://palladians.github.io/herald/contribute">
<img src="https://img.shields.io/badge/Contributor%20starter%20pack-Doc-green?logo=github"/>
</a>

<a href="https://www.npmjs.com/package/herald-sdk">
<img src="https://img.shields.io/badge/NPM-Herald%20SDK-CB3837?style=for-the-badge&logo=npm&logoColor=white"/>
</a>

<a href="https://https://palladians.github.io/herald/benchmarks">
<img src="https://img.shields.io/badge/Benchmark-Performance-blue?logo=github-actions"/>
</a>
</div>

# 🪽 Herald: SnarkyJS Credential Creation, Issuance & Proving Framework

Welcome to **Herald**! A [SnarkyJS](https://docs.minaprotocol.com/zkapps/snarkyjs) credential creation, 
Crafting, issuing, and proving digital heralds has never been this enchanting.

Harnessing the might of SnarkyJS, and fortified by Kimchi, Herald empowers you to seamlessly create 
and manage credentials, delivering unparalleled performance in the realm of Mina's 
zk-SNARK world. 🪶

Embark on a journey into verifiable credentials and client-side proving. Join our passionate 
community of contributors! Together, we're pioneering the future of credentials not just within the 
Mina ecosystem, but throughout Web3.

🧙‍♂️ Unleash the spellbinding capabilities of Herald, your ultimate toolkit for establishing a fortified 
fortress around digital identity. Embrace the power of SnarkyJS and witness the metamorphosis of the 
credential ecosystem. Let Herald be the wizard's hat to your magical adventure.

Herald seeks to be compatible with the data model outlined by W3C's [**Verifiable Credential Data Model**](https://www.w3.org/TR/vc-data-model/).
It does so by mapping JSON credential objects to SnarkyJS MerkleMaps. The issuer signs the MerkleMap's root, 
with that signature a subject can prove arbitrary properties of their credentials privately using ZkPrograms. 
The resulting proof can then be used for many things, including in smart contracts and other SnarkyJS recursive
programs! The possible use-cases are not limited ⚡

## 🌌 Features
- Craft, Issue, and Prove Credentials 🎓
- Built upon the power of SnarkyJS 🧙‍♂️
- Effortless integration with the Mina ecosystem 🌍
- Comprehensive documentation 📖
- Active development and an engaged community 🌟

## 📚 Documentation
Navigate through our extensive documentation which covers all facets of Herald:

- [Introduction](https://palladians.github.io/herald/introduction)
- [Architecture Overview](https://palladians.github.io/herald/architecture)
- [Getting Started Guide](https://palladians.github.io/herald/build)
- [Credential Creation and Issuance](https://palladians.github.io/herald/build#create-credential-for-subject)
- [Credential Creation and Issuance - CLI](https://palladians.github.io/herald/build#cli-credential-creation-example)
- [Challenges for Credential Owners](https://palladians.github.io/herald/build#construct-challenge)
- [Proving Credentials](https://palladians.github.io/herald/build#prove-that-the-credential-can-satisfy-this-rule)
- [Verifying Proofs](https://palladians.github.io/herald/build#verify-the-proof-1)

## Benchmarking
Benchmarking is vital in understanding the performance and efficiency of Herald throughout its lifecycle. It gives insights into how efficiently Herald generates and verifies zk-SNARK proofs, crucial for achieving swift, responsive applications.

The benchmark tests are conducted on a Linux-based virtual machine with the following specifications:

- CPU: An 8-core CPU, perfect for tasks requiring multi-threading.
- Memory: 32 GB RAM to cater to high-memory demands.
- Storage: 300 GB SSD for fast data access.
- OS: The system runs on Ubuntu 22.04, the latest version as of 2022.

### Proving Time Benchmarks
Proving Time is a measure of how long it takes to generate a zk-SNARK proof. In Herald, it indicates the speed at which a client can produce a proof for a given rule provided by a challenger. A practical example would be the time it takes for someone to prove they're above 18 using a credential issued by a specific authority.

Swift proving times are pivotal, especially for apps depending on frequent or time-sensitive zk-SNARK proofs. However, proving time can be influenced by numerous factors like computational resources, circuit sizes, and computation complexity. It's essential to understand that different users might have varying efficiency needs. While a sequencer might not require rapid proving times, a wallet aiming for a seamless user experience would.

### Verification Time Benchmarks
Verification Time represents the time needed to verify a zk-SNARK proof. It's all about how swiftly a challenger can authenticate proofs given by a subject.

Fast verification times are the backbone of zk-SNARK reliant systems. They guarantee quick confirmations, fostering real-time responsiveness in applications. Ideally, zk-SNARK verification should be 🔥 blazing 🔥 fast!

### Proof Size Benchmarks
Proof Size denotes the storage space occupied by a zk-SNARK proof. This benchmark evaluates Herald's prowess in producing compact proofs - a trait zk-SNARKs are inherently known for! 🔎

Proof size is a critical factor, especially considering storage and transmission. Concise proofs lead to reduced storage demands and swifter transmission, crafting more scalable and efficient apps and interactions.

To stay updated with Herald's benchmarking progress and insights, visit our [**Benchmark Page**](https://palladians.github.io/herald/benchmarks).

### Run Benchmarks Yourself 🚀

To run the benchmarks yourself, from the root:
```bash
pnpm i && pnpm build && pnpm run benchmark
```

## 🤝 Contribute
Herald thrives with the combined magic of our community wizards. We welcome contributors with open arms. For more details, check out our contributing guide.

## 📖 License

This project is licensed under the **MIT license**.

See [LICENSE](LICENSE) for more information.

Happy building! ❤️ 

## Contributors ✨

Thanks goes to these wonderful people
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/teddyjfpender"><img src="https://avatars.githubusercontent.com/u/92999717?v=4?s=100" width="100px;" alt="Teddy Pender"/><br /><sub><b>Teddy Pender</b></sub></a><br /><a href="https://github.com/palladians/herald/commits?author=teddyjfpender" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
([emoji key](https://allcontributors.org/docs/en/emoji-key)):